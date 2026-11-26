import { useState } from "react";
import type { Chat } from "../../chat/useChat.js";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { takeOfState } from "../foot/moneyAction.js";
import { nextActionOf, type ActionId } from "../foot/nextAction.js";
import { useMoneyLeft } from "../foot/useMoneyLeft.js";
import { reviewCountTextOf, reviewTotalOf } from "@yumekit/project/takes";
import { sentNotesOf } from "../takes/review/sentNotes.js";
import { useTakeReview } from "../takes/review/useTakeReview.js";
import { reviewItemIdsOf } from "../takes/shownItems.js";
import { useTakeSend } from "../takes/useTakeSend.js";
import { storyItemId } from "../story/StoryReading.js";
import { storyRequestOf } from "./storyRequests.js";
import { latestTakeIdOf, projectFactsOf, takeCostOf } from "./projectFacts.js";
import { workStateOf, type ViewChoice } from "./workState.js";

export type ProjectWork = ReturnType<typeof useProjectWork>;

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
  const take = takeOfState(state);
  const isStory = state.kind === "story";
  const review = useTakeReview({
    client,
    draftId: take?.id ?? (isStory ? storyItemId : undefined),
  });
  const itemIds =
    take === undefined
      ? isStory
        ? [storyItemId]
        : []
      : reviewItemIdsOf({ snapshot, take });
  const money = useMoneyLeft({
    client,
    readyTakeId: take?.state === "ready" ? take.id : undefined,
  });
  const sending = useTakeSend({
    client,
    take,
    review,
    itemIds,
    money,
    onDone: () => {
      setChoice({ kind: "auto" });
    },
  });
  const sent = sentNotesOf({ drafts: review.drafts, itemIds });
  const next = facts.chapters[facts.chapterIndex + 1];
  const action = nextActionOf({
    state,
    noteCount: isStory ? sent.length : reviewTotalOf(sending.counts),
    countText: reviewCountTextOf(sending.counts),
    latestTakeId:
      take === undefined
        ? undefined
        : latestTakeIdOf({ takes: facts.takes, take }),
    isStoryApproved: facts.isStoryApproved,
    hasNextChapter: next !== undefined,
    isLeadRunning: chat.isRunning,
    takeCost: take === undefined ? 0 : takeCostOf({ take, snapshot }),
    money,
  });
  const show = (view: { choice: ViewChoice; chapterId?: string }) => {
    sending.clearFailure();
    setChoice(view.choice);
    if (view.chapterId !== undefined) setPickedChapterId(view.chapterId);
  };
  const askLead = (input: Parameters<Chat["send"]>[0]) => () => {
    sending.run(async () =>
      (await chat.send(input)) ? undefined : "The lead did not start.",
    );
  };
  const handlers: Record<ActionId, () => void> = {
    ...sending.handlers,
    "approve-story": askLead(storyRequestOf([])),
    "send-story": askLead(storyRequestOf(sent)),
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
    review,
    action,
    isBusy: sending.isBusy,
    failure: sending.failure,
    show,
    act: (id: ActionId) => {
      handlers[id]();
    },
  };
}
