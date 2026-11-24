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
      camera: { size: "medium", angle: "eye-level" },
    });
    expect(harness.store.read().bible.storyPlan).toBeUndefined();
  });

  it("warns when a shot in the same place starts in another state than the end before it", async () => {
    const harness = await startHarness();
    await makeForgeSheets(harness);

    const result = await setPlan({
      harness,
      shots: [
        { shot_id: "strike" },
        {
          shot_id: "quench",
          start_state: "The blade is straight in her hand.",
          end_state: "The blade hisses in the water.",
        },
      ],
    });

    expect(warningsOf(result.data)).toEqual([
      'Shot "quench" is in the same place as "strike", but its start state differs from the end state before it. Start it where "strike" ends: The blade is bent on the anvil.',
    ]);
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
          start_state: "She stands.",
          end_state: "She stands",
        },
        { shot_id: "room", place_id: "room" },
      ],
    });
    const warnings = warningsOf(result.data);

    expect(warnings).toHaveLength(5);
    expect(warnings[0]).toContain('The action of shot "city" walks');
    expect(warnings[1]).toContain('Nothing changes in shot "forest"');
    expect(warnings[2]).toContain('Shot "city" gives the next shot nothing');
    expect(warnings[3]).toContain("The plan has 3 places (city, forest, room)");
    expect(warnings[4]).toContain(
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
