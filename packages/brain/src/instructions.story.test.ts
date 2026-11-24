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
      "read get_story_guide, then work in this order: the story plan with set_story_plan, a sheet for each person, place, and prop, the start picture of each shot, the clip of each shot with shot_id, and review_clip for each clip. Place only a clip that you kept or cut.",
    );
  });
});
