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

  it("send the work through the plan, its check, the sheets, the calibration shots, the shots, and the review in order", () => {
    expect(brainInstructions).toContain(
      "read get_story_guide, then work in this order: the story plan with set_story_plan, with the prompt of each start picture and clip; each person, place, and prop with its facts and sheet_prompts; review_plan until the critic passes the plan, at most twice (after two fails the check is used up, and the work goes on with the open faults as notes for the critic; only a broken fact of the brief still blocks); a sheet for each entry with review_sheet, which can start before the plan check; the easiest and the hardest shot of the plan check; then the other shots at the same time (rule 40), each with its start picture and its clip with shot_id, and review_clip for the clip.",
    );
  });

  it("make the final answer give the measure: first tries, the tries of each sheet and shot, and the money on refusals", () => {
    expect(brainInstructions).toContain(
      "36. Your final answer about a story video gives the shots accepted on the first try out of all shots, the tries of each sheet and shot, the money spent on refused pictures and clips (get_work gives these three),",
    );
    expect(brainInstructions).toContain(
      "Never say that every shot passes, or that a check found no problems, when a fault stays.",
    );
  });

  it("limit the tries and ask for facts that a picture can show", () => {
    expect(brainInstructions).toContain(
      "38. Each fact of a sheet is something a picture can show, never a bare number.",
    );
    expect(brainInstructions).toContain(
      "After two refusals, make one simplified try with a form from the known limits.",
    );
  });

  it("keep the end card of a story film in the colors of the film with only the words of the person", () => {
    expect(brainInstructions).toContain(
      "37. The end card of a story film uses the colors of the art direction (set_look with colors) and a font that fits the film, and shows only the words that the person asked for.",
    );
  });

  it("make the shots of a film at the same time, each waiting only for what it needs", () => {
    expect(brainInstructions).toContain(
      "Make the start pictures of all free shots in one generate_assets call, review them in one review_several call, make their clips in one generate_assets call, and review them in one review_several call.",
    );
  });
});
