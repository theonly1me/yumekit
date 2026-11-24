import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";
import { makeForgeSheets, setPlan } from "../testing/storyFixture.js";

function warningsOf(data: Record<string, unknown>): string[] {
  const { warnings } = data;
  return Array.isArray(warnings)
    ? warnings.filter((warning) => typeof warning === "string")
    : [];
}

describe("set_story_plan", () => {
  it("stores the plan in the bible as one undo step", async () => {
    const harness = await startHarness();

    const result = await setPlan({ harness, shots: [{ shot_id: "strike" }] });
    const stored = harness.store.read().bible.storyPlan;
    await harness.call({ name: "undo" });

    expect(result.isError).toBe(false);
    expect(stored?.logline).toBe("A smith forges a blade for her brother.");
    expect(stored?.shots[0]).toMatchObject({
      id: "strike",
      placeId: "forge",
      castIds: ["smith"],
      camera: { size: "medium", angle: "eye-level", lens: "normal" },
      startState: [
        {
          castId: "smith",
          where: "at the anvil",
          screen: "center",
          facing: "camera",
          state: "the blade is straight",
        },
      ],
      musicIntensity: 2,
    });
    expect(harness.store.read().bible.storyPlan).toBeUndefined();
  });

  it("warns when a character changes its place, side, or facing across a cut in the same place", async () => {
    const harness = await startHarness();
    await makeForgeSheets(harness);

    const result = await setPlan({
      harness,
      shots: [
        { shot_id: "strike" },
        {
          shot_id: "quench",
          start: [
            {
              cast_id: "smith",
              screen: "left",
              facing: "away",
              state: "the blade is bent",
            },
          ],
          end: [{ cast_id: "smith", state: "the blade hisses" }],
        },
      ],
    });

    expect(warningsOf(result.data)).toEqual([
      '"smith" changes across the cut from "strike" to "quench" with no move between them: screen side (center / left), facing (camera / away). Keep the place, the screen side, and the facing across a cut, or plan a shot that shows the move.',
    ]);
  });

  it("refuses a state that misses a person of the shot or joins two in one entry", async () => {
    const harness = await startHarness();

    const result = await setPlan({
      harness,
      shots: [
        {
          shot_id: "duel",
          cast_ids: ["smith", "brother"],
          start: [{ cast_id: "smith", state: "both face each other" }],
        },
      ],
    });

    expect(result.data).toMatchObject({ kind: "state-incomplete" });
    expect(result.data["message"]).toContain(
      'duel.start_state has no entry for "brother".',
    );
    expect(harness.store.read().bible.storyPlan).toBeUndefined();
  });

  it("warns about a shot where nothing changes, a walk, a shot that gives nothing, many places, and missing cast", async () => {
    const harness = await startHarness();

    const result = await setPlan({
      harness,
      shots: [
        {
          shot_id: "city",
          place_id: "city",
          action: "She walks through the neon city",
          inherits: "",
        },
        {
          shot_id: "forest",
          place_id: "forest",
          start: [{ cast_id: "smith", state: "She stands." }],
          end: [{ cast_id: "smith", state: "She stands" }],
        },
        { shot_id: "room", place_id: "room" },
      ],
    });
    const warnings = warningsOf(result.data);

    expect(warnings).toHaveLength(7);
    expect(warnings[0]).toContain(
      "3 shots in a row (city, forest, room) have the same size and angle",
    );
    expect(warnings[1]).toContain('The first shot "city" opens with a walk');
    expect(warnings[2]).toContain('The action of shot "city" walks');
    expect(warnings[3]).toContain('Nothing changes in shot "forest"');
    expect(warnings[4]).toContain('Shot "city" gives the next shot nothing');
    expect(warnings[5]).toContain("The plan has 3 places (city, forest, room)");
    expect(warnings[6]).toContain(
      "The cast has no entry for city, smith, forest, room yet",
    );
  });

  it("refuses a shot id twice and keeps the plan as it was", async () => {
    const harness = await startHarness();

    const result = await setPlan({
      harness,
      shots: [{ shot_id: "strike" }, { shot_id: "strike" }],
    });

    expect(result.data).toMatchObject({ kind: "id-in-use" });
    expect(harness.store.read().bible.storyPlan).toBeUndefined();
  });

  it("keeps the plan and the cast facts when set_bible changes the art direction", async () => {
    const harness = await startHarness();
    await makeForgeSheets(harness);
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });

    await harness.call({
      name: "set_bible",
      arguments: { style: "Ink and wash.", palette: [], voice: "" },
    });
    const { bible } = harness.store.read();

    expect(bible.style).toBe("Ink and wash.");
    expect(bible.storyPlan?.shots.map((shot) => shot.id)).toEqual(["strike"]);
    expect(bible.cast.map((member) => member.facts)).toEqual([
      ["The door is on the right wall, hinges on its left edge"],
      ["The hammer is in her right hand"],
    ]);
  });
});
