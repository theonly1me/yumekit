import { describe, expect, it } from "vitest";
import { assetItem, takeOf } from "../../testing/takeFacts.js";
import type { WorkState } from "../work/workState.js";
import { nextActionOf } from "./nextAction.js";

function actionOf(options: {
  state: WorkState;
  noteCount?: number;
  isStoryApproved?: boolean;
  hasNextChapter?: boolean;
}) {
  return nextActionOf({
    noteCount: 0,
    latestTakeId: undefined,
    isStoryApproved: false,
    hasNextChapter: false,
    isLeadRunning: true,
    takeCost: 0.18,
    ...options,
  });
}

const pictures = takeOf({
  id: "take-1",
  items: [assetItem("ferry")],
  nextStepEstimateUsd: 2.82,
});

describe("the one next action", () => {
  it("sends the notes of a take, with their count", () => {
    expect(
      actionOf({ state: { kind: "take", take: pictures }, noteCount: 2 }),
    ).toEqual({
      line: "Mark only what needs a change. Everything else counts as approved. This take cost $0.18.",
      buttons: [
        { id: "send", label: "Send 2 notes to the lead", isPrimary: true },
      ],
    });
  });

  it("names the next step and its price when nothing is marked", () => {
    const action = actionOf({ state: { kind: "take", take: pictures } });

    expect(action.buttons.map((button) => button.label)).toEqual([
      "All good. Make the clips, about $2.82",
    ]);
  });

  it("approves the story through its take, and asks in the chat when the lead made no take", () => {
    const storyTake = takeOf({ id: "take-1", step: "story" });

    expect(
      actionOf({ state: { kind: "story", take: storyTake } }).buttons,
    ).toEqual([{ id: "send", label: "Approve the story", isPrimary: true }]);
    expect(
      actionOf({ state: { kind: "story", take: undefined } }).buttons,
    ).toEqual([
      { id: "approve-story", label: "Approve the story", isPrimary: true },
    ]);
  });

  it("offers Stop while the lead makes a take", () => {
    expect(actionOf({ state: { kind: "making", take: pictures } })).toEqual({
      line: "This take has cost $0.18 so far.",
      buttons: [{ id: "stop", label: "Stop", isPrimary: false }],
    });
  });

  it("approves the cut, then offers the next chapter, and Export after the last one", () => {
    const cut = takeOf({ id: "take-4", step: "cut" });
    const approved = { ...cut, state: "sent" as const };

    expect(
      actionOf({ state: { kind: "film", take: cut } }).buttons[0]?.label,
    ).toBe("Approve the cut");
    expect(
      actionOf({
        state: { kind: "film", take: approved },
        hasNextChapter: true,
      }).buttons.map((button) => button.label),
    ).toEqual(["Export", "Next chapter"]);
    expect(actionOf({ state: { kind: "film", take: approved } })).toEqual({
      line: "The film is done.",
      buttons: [{ id: "export", label: "Export", isPrimary: true }],
    });
  });
});
