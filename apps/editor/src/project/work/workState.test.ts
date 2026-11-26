import { describe, expect, it } from "vitest";
import { assetItem, takeOf } from "../../testing/takeFacts.js";
import type { Take } from "../takes/takeTypes.js";
import { workStateOf, type WorkFacts } from "./workState.js";

function factsOf(fields: Partial<WorkFacts>): WorkFacts {
  return {
    takes: [],
    chapterId: "film",
    hasStory: false,
    isStoryApproved: false,
    isLeadRunning: false,
    hasOpenQuestions: false,
    hasRequest: true,
    startFailure: undefined,
    ...fields,
  };
}

function autoStateOf(fields: Partial<WorkFacts>) {
  return workStateOf({ facts: factsOf(fields), choice: { kind: "auto" } });
}

const story = { hasStory: true, isStoryApproved: true };

describe("the state of the work area", () => {
  it("shows the lead reading the request before any story or take", () => {
    expect(autoStateOf({ isLeadRunning: true })).toEqual({
      kind: "waiting",
      phase: "reading",
    });
  });

  it("asks the person to answer an open round of questions", () => {
    expect(autoStateOf({ hasOpenQuestions: true })).toEqual({
      kind: "waiting",
      phase: "questions",
    });
  });

  it("shows the story to read while the person has not approved it", () => {
    const storyTake = takeOf({ id: "take-1", step: "story" });
    delete storyTake.chapterId;

    expect(autoStateOf({ hasStory: true, takes: [storyTake] })).toEqual({
      kind: "story",
      take: storyTake,
    });
  });

  it("shows the open take as the lead at work, before the person's choice", () => {
    const open = takeOf({ id: "take-2", state: "open" });

    expect(
      workStateOf({
        facts: factsOf({ ...story, takes: [open], isLeadRunning: true }),
        choice: { kind: "story" },
      }),
    ).toEqual({ kind: "story", take: undefined });
    expect(
      autoStateOf({ ...story, takes: [open], isLeadRunning: true }),
    ).toEqual({ kind: "making", take: open });
  });

  it("shows a ready take of pictures as a take, and a ready cut as the film", () => {
    const pictures = takeOf({ id: "take-1", items: [assetItem("ferry")] });
    const cut: Take = takeOf({ id: "take-2", number: 2, step: "cut" });

    expect(autoStateOf({ ...story, takes: [pictures] })).toEqual({
      kind: "take",
      take: pictures,
    });
    expect(
      autoStateOf({ ...story, takes: [{ ...pictures, state: "sent" }, cut] }),
    ).toEqual({ kind: "film", take: cut });
  });

  it("names the failure of the first request when no request reached the lead", () => {
    expect(
      autoStateOf({ hasRequest: false, startFailure: "no-agent" }),
    ).toEqual({ kind: "failed", failureKind: "no-agent" });
  });

  it("keeps the takes of another chapter out of the picked chapter", () => {
    const other = takeOf({ id: "take-1", chapterId: "c2" });

    expect(autoStateOf({ ...story, takes: [other], chapterId: "c1" })).toEqual({
      kind: "story",
      take: undefined,
    });
  });
});
