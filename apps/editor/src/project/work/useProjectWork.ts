import { useState } from "react";
import type { Chat } from "../../chat/useChat.js";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { nextActionOf, type ActionId } from "../foot/nextAction.js";
import { sentNotesOf } from "../takes/notes/draftNotes.js";
import { useTakeNotes } from "../takes/notes/useDraftNotes.js";
import { sendTake } from "../takes/sendTake.js";
import { storyRequestOf } from "./storyRequests.js";
import { latestTakeIdOf, projectFactsOf, takeCostOf } from "./projectFacts.js";
import { workStateOf, type ViewChoice, type WorkState } from "./workState.js";

export type ProjectWork = ReturnType<typeof useProjectWork>;

function takeOf(state: WorkState) {
  return "take" in state ? state.take : undefined;
}

export function useProjectWork(options: {
  client: EngineClient;
  snapshot: Snapshot;
  chat: Chat;
  startFailure: string | undefined;
  onExport: () => void;
}) {
  const { client, snapshot, chat } = options;
  const [choice, setChoice] = useState<ViewChoice>({ kind: "auto" });
  const [pickedChapterId, setPickedChapterId] = useState<string>();
  const [isBusy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const facts = projectFactsOf({
    snapshot,
    entries: chat.entries,
    pickedChapterId,
  });
  const state = workStateOf({
    facts: {
      ...facts,
      isLeadRunning: chat.isRunning,
      startFailure: options.startFailure,
    },
    choice,
  });
  const take = takeOf(state);
  const notes = useTakeNotes(take?.id ?? `${state.kind}-draft`);
  const sent = sentNotesOf(notes.draft);
  const next = facts.chapters[facts.chapterIndex + 1];
  const action = nextActionOf({
    state,
    noteCount: sent.length,
    latestTakeId:
      take === undefined
        ? undefined
        : latestTakeIdOf({ takes: facts.takes, take }),
    isStoryApproved: facts.isStoryApproved,
    hasNextChapter: next !== undefined,
    isLeadRunning: chat.isRunning,
    takeCost: take === undefined ? 0 : takeCostOf({ take, snapshot }),
  });
  const show = (view: { choice: ViewChoice; chapterId?: string }) => {
    setFailure(undefined);
    setChoice(view.choice);
    if (view.chapterId !== undefined) setPickedChapterId(view.chapterId);
  };
  const busyWith = (work: () => Promise<string | undefined>) => {
    setBusy(true);
    setFailure(undefined);
    work()
      .then((problem) => {
        setFailure(problem);
        if (problem === undefined) {
          notes.clear();
          setChoice({ kind: "auto" });
        }
      })
      .finally(() => {
        setBusy(false);
      })
      .catch(() => undefined);
  };
  const handlers: Record<ActionId, () => void> = {
    send: () => {
      if (take === undefined) return;
      busyWith(async () => {
        const outcome = await sendTake({
          client,
          takeId: take.id,
          notes: sent,
        });
        return outcome.ok ? undefined : outcome.message;
      });
    },
    "approve-story": () => {
      busyWith(async () =>
        (await chat.send(storyRequestOf([])))
          ? undefined
          : "The lead did not start.",
      );
    },
    "send-story": () => {
      busyWith(async () =>
        (await chat.send(storyRequestOf(sent)))
          ? undefined
          : "The lead did not start.",
      );
    },
    stop: () => {
      chat.stop().catch(() => undefined);
    },
    "open-latest": () => {
      show({ choice: { kind: "auto" } });
    },
    "next-chapter": () => {
      show({
        choice: { kind: "auto" },
        ...(next === undefined ? {} : { chapterId: next.id }),
      });
    },
    export: options.onExport,
  };
  return {
    facts,
    state,
    choice,
    notes,
    action,
    isBusy,
    failure,
    show,
    act: (id: ActionId) => {
      handlers[id]();
    },
  };
}
