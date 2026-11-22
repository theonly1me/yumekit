import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClientFailure, EngineClient } from "../engine/engineClient.js";
import { useEngineEvents } from "../engine/useEngineEvents.js";
import { failureTextOf } from "../tools/requestText.js";
import { hasRunningAnswer, withEntry } from "./chatEntries.js";
import { chatRequestsOf, type AskInput } from "./chatRequests.js";
import type { AnswerEntry, ChatAgent, ChatEntry } from "./chatSchemas.js";

export type Chat = ReturnType<typeof useChat>;

export interface StartFailure {
  kind: string;
  message: string;
  retry: AskInput;
}

function startFailureOf(options: {
  failure: ClientFailure;
  retry: AskInput;
}): StartFailure {
  const { failure, retry } = options;
  return {
    kind: failure.kind === "request-failed" ? (failure.engineKind ?? "") : "",
    message: failureTextOf(failure),
    retry,
  };
}

export function useChat(client: EngineClient) {
  const requests = useMemo(() => chatRequestsOf(client), [client]);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [agent, setAgent] = useState<ChatAgent | null>();
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [isWaiting, setWaiting] = useState(false);
  const [startFailure, setStartFailure] = useState<StartFailure>();
  const [announcement, setAnnouncement] = useState("");

  const entriesDuringLoads = useRef(new Set<ChatEntry[]>());

  const reload = useCallback(() => {
    const changedDuringLoad: ChatEntry[] = [];
    entriesDuringLoads.current.add(changedDuringLoad);
    requests
      .view()
      .finally(() => {
        entriesDuringLoads.current.delete(changedDuringLoad);
      })
      .then(
        (view) => {
          if (!view.ok) return;
          let loaded = view.value.entries;
          for (const entry of changedDuringLoad) {
            loaded = withEntry({ entries: loaded, entry });
          }
          setEntries(loaded);
          setAgent(view.value.agent);
          setWaiting(false);
        },
        () => undefined,
      );
  }, [requests]);

  useEffect(reload, [reload]);

  useEngineEvents({
    client,
    onEvent: (event) => {
      if (event.type === "connection-opened") reload();
      if (event.type === "chat-text") {
        setTexts((current) => ({ ...current, [event.id]: event.text }));
      }
      if (event.type !== "chat-changed") return;
      const { entry } = event;
      for (const changed of entriesDuringLoads.current) changed.push(entry);
      setEntries((current) => withEntry({ entries: current, entry }));
      if (entry.kind !== "answer") return;
      setWaiting(false);
      if (entry.state === "done") setAnnouncement(entry.text);
    },
  });

  const send = useCallback(
    async (input: AskInput): Promise<boolean> => {
      setWaiting(true);
      setStartFailure(undefined);
      const asked = await requests.ask(input);
      if (!asked.ok) {
        setWaiting(false);
        setStartFailure(
          startFailureOf({ failure: asked.failure, retry: input }),
        );
        reload();
        return false;
      }
      setEntries((current) =>
        withEntry({ entries: current, entry: asked.value }),
      );
      return true;
    },
    [requests, reload],
  );

  const undo = useCallback(
    async (changeId: string): Promise<string | undefined> => {
      const undone = await requests.undo(changeId);
      if (!undone.ok) return failureTextOf(undone.failure);
      setEntries((current) =>
        withEntry({ entries: current, entry: undone.value }),
      );
      return undefined;
    },
    [requests],
  );

  return {
    entries,
    agent,
    textOf: (answer: AnswerEntry) =>
      answer.state === "running"
        ? (texts[answer.id] ?? answer.text)
        : answer.text,
    isRunning: isWaiting || hasRunningAnswer(entries),
    startFailure,
    announcement,
    reload,
    send,
    undo,
    stop: () => requests.stop().then(() => undefined),
    chooseAgent: async (agentId: string): Promise<string | undefined> => {
      const saved = await requests.saveAgent(agentId);
      reload();
      return saved.ok ? undefined : failureTextOf(saved.failure);
    },
  };
}
