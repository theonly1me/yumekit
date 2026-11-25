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

  it("send the work through the story, the plan, and four batches, with one hard check: the design", () => {
    expect(brainInstructions).toContain(
      "then four batches (rule 40). The checks of get_work decide who checks: in draft (the default), you check the design of each batch with check_design; in critic, the critic checks each batch with review_several. Only a break of the design blocks a picture or a clip.",
    );
    expect(brainInstructions).toContain(
      "In draft, call the critic only when the person asks for a second look.",
    );
  });

  it("make the final answer give the time of each stage, and never claim that a check found no problems", () => {
    expect(brainInstructions).toContain(
      "36. Your final answer about a story video gives the time of each stage and the time left of the target (get_work gives them),",
    );
    expect(brainInstructions).toContain(
      "Never say that every shot passes, or that a check found no problems, when a fault stays.",
    );
  });

  it("ask for facts that a picture can show, and correct a picture from itself", () => {
    expect(brainInstructions).toContain(
      "38. Each fact of a sheet is something a picture can show, never a bare number.",
    );
    expect(brainInstructions).toContain(
      "To correct a picture, start from it (in reference_asset_ids) and change only what is wrong.",
    );
  });

  it("keep the end card of a story film in the colors of the film with only the words of the person", () => {
    expect(brainInstructions).toContain(
      "37. The end card of a story film uses the colors of the art direction (set_look with colors) and a font that fits the film, and shows only the words that the person asked for.",
    );
  });

  it("make a film in four batches, each shot waiting only for what it needs", () => {
    expect(brainInstructions).toContain(
      "40. Make a film in four batches, each in one generate_assets call: all sheets, all start (and end) pictures, all clips, then the music. Check each batch of pictures or clips in one call.",
    );
  });

  it("start a story film with the whole story, ask the person before the money, and keep every word in the story", () => {
    expect(brainInstructions).toContain(
      "42. A story film (a trailer, a short, an anime, a music video with a story) starts with its story, not its shots.",
    );
    expect(brainInstructions).toContain(
      "Then end your turn: show the story to the person in plain words and ask for a yes or changes, and make nothing else until the person answers. A request to make a film is not a yes to its story;",
    );
    expect(brainInstructions).toContain(
      "a line is good when it could belong to this story only",
    );
  });
});
