import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";
import { setPlan } from "../testing/storyFixture.js";

function warningsOf(data: Record<string, unknown>): string[] {
  const { warnings } = data;
  return Array.isArray(warnings)
    ? warnings.filter((warning) => typeof warning === "string")
    : [];
}

const ring = {
  shot_id: "ring",
  place_id: "forest",
  cast_ids: ["hero", "demons"],
  camera_size: "wide",
  action: "He slashes the ring of demons and they burst into smoke",
  start: [
    { cast_id: "hero", state: "crouched, sword out" },
    {
      cast_id: "demons",
      count: 8,
      state: "rushing in",
      enters_from: "the trees",
    },
  ],
  end: [
    { cast_id: "hero", state: "crouched, sword out" },
    { cast_id: "demons", count: 8, state: "gone in smoke" },
  ],
};

describe("set_story_plan direction warnings", () => {
  it("warns about a strike with no target, more than two opponents, and a fight with no close strike", async () => {
    const harness = await startHarness();

    const result = await setPlan({
      harness,
      shots: [
        {
          ...ring,
          strikes: [
            {
              by: "hero",
              target: "demons",
              contact: "their chests",
              reaction: "they burst into smoke",
            },
          ],
        },
        {
          ...ring,
          shot_id: "again",
          camera_size: "medium",
          action: "He slashes the last demon and it falls",
          start: [
            { cast_id: "hero", state: "crouched, sword out" },
            { cast_id: "demons", count: 8, state: "gone in smoke" },
          ],
        },
      ],
    });
    const warnings = warningsOf(result.data);

    expect(warnings).toContain(
      'Shot "again" has a strike in its action but no strikes. Name the target, the point of contact, the reaction of that target, and the source and path of each effect.',
    );
    expect(warnings).toContain(
      'Shot "ring" fights 8 opponents. Fight one or two: each needs its own design, place, attack, and reaction, or the fight reads as waving a sword at the air.',
    );
    expect(warnings).toContain(
      "The fight has no close shot of a strike that lands. Add a close-up or an extreme close-up of the blade meeting its target, and cut on the strike.",
    );
  });

  it("warns when a character first shows with no entrance, and when more of a group come from nowhere", async () => {
    const harness = await startHarness();

    const result = await setPlan({
      harness,
      shots: [
        { shot_id: "wake", place_id: "forest", cast_ids: ["hero"] },
        {
          shot_id: "ambush",
          place_id: "forest",
          cast_ids: ["hero", "demons"],
          camera_size: "close-up",
          start: [
            { cast_id: "hero", state: "the blade is bent" },
            { cast_id: "demons", count: 2, state: "crouched" },
          ],
          end: [
            { cast_id: "hero", state: "the blade is bent" },
            { cast_id: "demons", count: 2, state: "crouched" },
          ],
        },
        {
          shot_id: "more",
          place_id: "forest",
          cast_ids: ["hero", "demons"],
          camera_size: "wide",
          start: [
            { cast_id: "hero", state: "the blade is bent" },
            { cast_id: "demons", count: 6, state: "crouched" },
          ],
        },
      ],
    });
    const warnings = warningsOf(result.data);

    expect(warnings).toContain(
      '"demons" first shows in shot "ambush" with no place where it waited. Give enters_from, or show it enter on screen.',
    );
    expect(warnings).toContain(
      'More "demons" show in shot "more" (6, before 2). Where did they come from? Give enters_from.',
    );
  });

  it("returns the music map as a cue sheet in film seconds", async () => {
    const harness = await startHarness();

    const result = await setPlan({
      harness,
      shots: [{ shot_id: "strike" }, { shot_id: "quench" }],
    });

    expect(result.data["music_cue_sheet"]).toBe(
      "[0s to 4s] strike: intensity 2 of 5\n[4s to 8s] quench: intensity 2 of 5",
    );
  });
});
