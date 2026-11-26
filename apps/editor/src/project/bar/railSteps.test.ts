import { describe, expect, it } from "vitest";
import { takeOf } from "../../testing/takeFacts.js";
import { railStepsOf } from "./railSteps.js";

function statusesOf(options: Parameters<typeof railStepsOf>[0]) {
  return railStepsOf(options).map((step) => `${step.label} ${step.status}`);
}

describe("the step rail", () => {
  it("shows Story and Cut for a film with no AI video", () => {
    expect(
      statusesOf({
        takes: [],
        chapterId: "film",
        hasAiVideo: false,
        isStoryApproved: false,
      }),
    ).toEqual(["Story now", "Cut next"]);
  });

  it("moves on after a take that the person sent with no notes", () => {
    const approved = takeOf({
      id: "take-1",
      state: "sent",
      sentAt: "2026-11-26T10:05:00.000Z",
    });

    expect(
      statusesOf({
        takes: [approved],
        chapterId: "film",
        hasAiVideo: true,
        isStoryApproved: true,
      }),
    ).toEqual(["Story done", "Pictures done", "Clips now", "Cut next"]);
  });

  it("stays on a step while its newest take has notes", () => {
    const withNotes = takeOf({
      id: "take-1",
      state: "sent",
      notes: [{ itemId: "harbor", text: "Taller." }],
    });

    expect(
      statusesOf({
        takes: [withNotes],
        chapterId: "film",
        hasAiVideo: true,
        isStoryApproved: true,
      }),
    ).toEqual(["Story done", "Pictures now", "Clips next", "Cut next"]);
  });
});
