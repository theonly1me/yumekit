import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";

describe("get_story_guide", () => {
  it("gives the bar of a film, the video prompt order with natural motion, and the corrected faults", async () => {
    const harness = await startHarness();

    const result = await harness.call({ name: "get_story_guide" });
    const guide = String(result.data["guide"]);

    expect(guide).toContain(
      "A character that only walks through places is a failure.",
    );
    expect(guide).toContain(
      "An object never moves, doubles, or changes sides.",
    );
    expect(guide).toContain("A single continuous shot, no scene cuts.");
    expect(guide).toContain(
      "approach, contact, transfer of weight, follow-through, recovery",
    );
    expect(guide).toContain("A fast fight is the hardest case.");
    expect(guide).toContain(
      "hinges on its left edge, a brass knob on its right edge",
    );
  });

  it("teaches a fight staged for a trailer, space across a cut, the music prompt, and the end card", async () => {
    const harness = await startHarness();

    const result = await harness.call({ name: "get_story_guide" });
    const guide = String(result.data["guide"]);

    expect(guide).toContain("## Staging a fight for a trailer");
    expect(guide).toContain("Start late, inside the action");
    expect(guide).toContain(
      "A fight against many works as a run of short shots, each with one strike and one reaction.",
    );
    expect(guide).toContain(
      "An effect that starts on the ground or at a random place is a fault.",
    );
    expect(guide).toContain("Its loudest part is the peak of the fight");
    expect(guide).toContain("Never draw two of it on one sheet");
    expect(guide).toContain("no prompt sign, no extra line");
  });

  it("puts the story first, gives the craft of each form and the parts of a trailer, the test of a line, the cards, and a trailer built from its story", async () => {
    const harness = await startHarness();

    const result = await harness.call({ name: "get_story_guide" });
    const guide = String(result.data["guide"]);

    expect(guide.indexOf("## Story first")).toBeLessThan(
      guide.indexOf("## The plan"),
    );
    expect(guide).toContain(
      "A trailer needs the whole story too, because it shows a part of it.",
    );
    expect(guide).toContain(
      "- trailer: moments from different times and places of a longer story. It raises a question and does not answer it, because the viewer must want to see the film. It never shows how a conflict ends",
    );
    expect(guide).toContain("- short: one complete small story with an end.");
    for (const part of [
      "1. The world as it was",
      "2. The break",
      "3. The stakes",
      "4. The rise",
      "5. The title",
    ]) {
      expect(guide).toContain(part);
    }
    expect(guide).toContain("Choose what to leave out");
    expect(guide).toContain(
      "The test: a line is good when it could belong to this story only.",
    );
    expect(guide).toContain("check_music measures the hits of a track");
    expect(guide).toContain(
      "## A worked example: a trailer built from its story",
    );
    expect(guide).toContain("No shot shows how anything ends.");
  });
});
