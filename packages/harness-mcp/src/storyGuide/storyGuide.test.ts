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
    expect(guide).toContain("Fight one or two opponents, not ten.");
    expect(guide).toContain(
      "An effect that starts on the ground or at a random place is a fault.",
    );
    expect(guide).toContain("Its loudest part is the peak of the fight");
    expect(guide).toContain("Never draw two of it on one sheet");
    expect(guide).toContain("no prompt sign, no extra line");
  });
});
