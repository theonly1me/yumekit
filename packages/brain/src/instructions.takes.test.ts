import { describe, expect, it } from "vitest";
import { brainInstructions } from "./index.js";

describe("the instructions for the work with the person", () => {
  it("ask in rounds of a few short questions before a choice that changes the video, then end the turn", () => {
    expect(brainInstructions).toContain(
      "43. When a request leaves open a choice that changes the video, such as the length, the story, the characters, or the look, ask with ask_person before you make anything, and end your turn.",
    );
    expect(brainInstructions).toContain(
      "Ask 3 to 6 short questions in a round, each with a few short options; the person can always answer in their own words.",
    );
    expect(brainInstructions).toContain(
      "ask again only when a choice is still open",
    );
  });

  it("work in takes with a note on each item, end the turn with the price of the next step, and make again only what the person marked", () => {
    expect(brainInstructions).toContain(
      "44. Work in takes, because the person sees your work on the project screen only in a take: call open_take before a step and ready_take after it, with an honest note on each item and what_to_check on each clip, music, and cut.",
    );
    expect(brainInstructions).toContain(
      "Then end your turn with one short line that gives the price of the next step. When the money left does not cover it, say so before the work, and offer fewer items.",
    );
    expect(brainInstructions).toContain(
      "When the person sends notes, make again only the items with a note, in a new take. When a take comes back with no note, go on to the next step at once.",
    );
  });
});
