import { describe, expect, it } from "vitest";
import { harnessWithThreeScenes } from "../testing/sceneClipFixture.js";
import type { Harness } from "../testing/harnessFixture.js";

async function musicOffOf(options: { harness: Harness; outputId: string }) {
  const timeline = await options.harness.call({
    name: "get_timeline",
    arguments: { output_id: options.outputId },
  });
  return JSON.stringify(timeline.data).includes(
    '"id":"music","kind":"audio","off":true',
  );
}

describe("set_track_off", () => {
  it("switches the track off in each output that has it, and get_timeline shows off", async () => {
    const harness = await harnessWithThreeScenes();

    const switched = await harness.call({
      name: "set_track_off",
      arguments: { track_id: "music", off: true },
    });

    expect(switched.data).toMatchObject({
      output_ids: ["wide", "tall"],
      off: true,
    });
    expect(await musicOffOf({ harness, outputId: "wide" })).toBe(true);
    expect(await musicOffOf({ harness, outputId: "tall" })).toBe(true);
  });

  it("is one undo step for all outputs", async () => {
    const harness = await harnessWithThreeScenes();
    const before = harness.store.read().timelines;

    await harness.call({
      name: "set_track_off",
      arguments: { track_id: "music", off: true },
    });
    await harness.call({ name: "undo" });

    expect(harness.store.read().timelines).toEqual(before);
  });

  it("switches the track on again with no field off in the stored track", async () => {
    const harness = await harnessWithThreeScenes();
    const before = harness.store.read().timelines;

    await harness.call({
      name: "set_track_off",
      arguments: { output_ids: ["tall"], track_id: "music", off: true },
    });
    const wideWhileTallIsOff = await musicOffOf({ harness, outputId: "wide" });
    await harness.call({
      name: "set_track_off",
      arguments: { track_id: "music", off: false },
    });

    expect(wideWhileTallIsOff).toBe(false);
    expect(harness.store.read().timelines).toEqual(before);
  });

  it("refuses an unknown track with track-not-found and a hint", async () => {
    const harness = await harnessWithThreeScenes();

    const refused = await harness.call({
      name: "set_track_off",
      arguments: { track_id: "missing", off: true },
    });

    expect(refused.data["kind"]).toBe("track-not-found");
    expect(refused.data["hint"]).toContain("get_timeline");
  });
});
