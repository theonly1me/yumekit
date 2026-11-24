import { describe, expect, it } from "vitest";
import { brainInstructions } from "./index.js";

describe("the instructions for a film with AI video", () => {
  it("state the bar of a film: meaningful actions, one world, and natural bodies", () => {
    expect(brainInstructions).toContain(
      "is a chain of meaningful actions with cause and effect, in a world that stays the same. A character that only walks through places is a failure.",
    );
    expect(brainInstructions).toContain(
      "Hands, fingers, and movement must look natural and human. An object must never move, double, or change sides.",
    );
  });

  it("send the work through the plan, the sheets, the shots, and the review in order", () => {
    expect(brainInstructions).toContain(
      "read get_story_guide, then work in this order: the story plan with set_story_plan, a sheet for each person, place, and prop with review_sheet for each, then for each shot in order its start picture and its clip with shot_id, and review_clip for the clip. An independent critic gives the verdict of review_clip and review_sheet. You cannot give or overrule it.",
    );
  });

  it("make the final answer count the clips and name each fault that stays, never every shot passes", () => {
    expect(brainInstructions).toContain(
      "36. Your final answer about a story video gives the count of clips kept, cut, and made again, each fault that the critic recorded and that stays in the film, and each planned thing that did not happen. Never say that every shot passes, or that a check found no problems, when a fault stays.",
    );
  });

  it("keep the end card of a story film in the colors of the film with only the words of the person", () => {
    expect(brainInstructions).toContain(
      "37. The end card of a story film uses the colors of the art direction (set_look with colors) and a font that fits the film, and shows only the words that the person asked for.",
    );
  });
});
