import { useEffect, useMemo, useRef, useState } from "react";
import { chatRequestsOf } from "../chat/chatRequests.js";
import type { AnswerEntry, ChatAgent } from "../chat/chatSchemas.js";
import type { EngineClient } from "../engine/engineClient.js";
import { useEngineEvents } from "../engine/useEngineEvents.js";
import { askInputOf } from "../parts/fixedRequests.js";
import { failureTextOf } from "../tools/requestText.js";
import type { ExactRequest } from "./exactRequests.js";

export interface LeadProgress {
  done: number;
  total?: number | undefined;
  message?: string | undefined;
}

export type LeadState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "running"; progress: LeadProgress | undefined }
  | { kind: "ended"; answer: AnswerEntry }
  | { kind: "not-sent"; message: string };

export type LeadReadiness =
  | { kind: "checking" }
  | { kind: "ready" }
  | { kind: "missing"; message: string };

const noAgentMessage =
  "Making this needs an AI program on this computer. Install Claude Code, Codex, or Cursor, then pick it in Settings.";

function readinessOf(agent: ChatAgent | null): LeadReadiness {
  if (agent === null) return { kind: "missing", message: noAgentMessage };
  if (agent.signIn === "signed-out") {
    return {
      kind: "missing",
      message: `${agent.name} is not signed in. Open a terminal, start it once, and sign in. Then try again.`,
    };
  }
  return { kind: "ready" };
}

function progressOf(answer: AnswerEntry): LeadProgress | undefined {
  return answer.steps.findLast((step) => step.state === "running")?.progress;
}

export function useLeadRequest(client: EngineClient) {
  const requests = useMemo(() => chatRequestsOf(client), [client]);
  const [state, setState] = useState<LeadState>({ kind: "idle" });
  const [readiness, setReadiness] = useState<LeadReadiness>({
    kind: "checking",
  });
  const awaited = useRef<{ answerId: string | undefined } | undefined>(
    undefined,
  );

  useEffect(() => {
    let isCurrent = true;
    requests
      .view()
      .then((view) => {
        if (!isCurrent) return;
        setReadiness(
          view.ok ? readinessOf(view.value.agent) : { kind: "ready" },
        );
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [requests]);

  useEngineEvents({
    client,
    onEvent: (event) => {
      const waiting = awaited.current;
      if (event.type !== "chat-changed" || waiting === undefined) return;
      const { entry } = event;
      if (entry.kind !== "answer") return;
      if (waiting.answerId === undefined && entry.state === "running") {
        waiting.answerId = entry.id;
      }
      if (entry.id !== waiting.answerId) return;
      if (entry.state === "running") {
        setState({ kind: "running", progress: progressOf(entry) });
        return;
      }
      awaited.current = undefined;
      setState({ kind: "ended", answer: entry });
    },
  });

  const send = (request: ExactRequest) => {
    if (state.kind === "sending" || state.kind === "running") return;
    awaited.current = { answerId: undefined };
    setState({ kind: "sending" });
    requests
      .ask(askInputOf(request))
      .then((asked) => {
        if (asked.ok) {
          setState((current) =>
            current.kind === "sending"
              ? { kind: "running", progress: undefined }
              : current,
          );
          return;
        }
        awaited.current = undefined;
        setState({ kind: "not-sent", message: failureTextOf(asked.failure) });
      })
      .catch((error: unknown) => {
        awaited.current = undefined;
        setState({ kind: "not-sent", message: String(error) });
      });
  };

  return {
    state,
    readiness,
    send,
    reset: () => {
      setState({ kind: "idle" });
    },
  };
}

export function stepDone(options: { answer: AnswerEntry; tool: string }) {
  return options.answer.steps.some(
    (step) => step.tool === options.tool && step.state === "done",
  );
}

export function answerLineOf(answer: AnswerEntry): string {
  if (answer.state === "stopped") return "The request was stopped.";
  const text = answer.text.trim();
  return text === "" ? "The AI did not make it. See the chat." : text;
}
