import { describe, expect, it } from "vitest";
import { harnessWithThreeScenes, rowOf } from "../testing/sceneClipFixture.js";

describe("move_scene_clip", () => {
  it("puts the clip at to_index and packs the row from the first start frame in each output", async () => {
    const harness = await harnessWithThreeScenes();

    const moved = await harness.call({
      name: "move_scene_clip",
      arguments: { clip_id: "three", to_index: 0 },
    });

    const expected = [
      ["three", "c", 0, 40],
      ["one", "a", 40, 30],
      ["two", "b", 70, 20],
    ];
    expect(moved.isError).toBe(false);
    expect(moved.data["output_ids"]).toEqual(["wide", "tall"]);
    expect(rowOf({ harness, outputId: "wide" })).toEqual(expected);
    expect(rowOf({ harness, outputId: "tall" })).toEqual(expected);
  });

  it("closes a gap between clips and keeps the start frame of the row", async () => {
    const harness = await harnessWithThreeScenes();
    await harness.call({
      name: "update_clip",
      arguments: {
        output_id: "wide",
        clip_id: "one",
        start_frame: 5,
        duration_frames: 25,
      },
    });
    await harness.call({
      name: "update_clip",
      arguments: { output_id: "wide", clip_id: "three", start_frame: 60 },
    });

    await harness.call({
      name: "move_scene_clip",
      arguments: { output_ids: ["wide"], clip_id: "one", to_index: 2 },
    });

    expect(rowOf({ harness, outputId: "wide" })).toEqual([
      ["two", "b", 5, 20],
      ["three", "c", 25, 40],
      ["one", "a", 65, 25],
    ]);
  });

  it("is one undo step for all outputs", async () => {
    const harness = await harnessWithThreeScenes();
    const before = harness.store.read().timelines;

    await harness.call({
      name: "move_scene_clip",
      arguments: { clip_id: "one", to_index: 1 },
    });
    await harness.call({ name: "undo" });

    expect(harness.store.read().timelines).toEqual(before);
  });

  it("changes nothing when to_index is the current index", async () => {
    const harness = await harnessWithThreeScenes();
    const before = harness.store.read().revision;

    const moved = await harness.call({
      name: "move_scene_clip",
      arguments: { clip_id: "two", to_index: 1 },
    });

    expect(moved.data["revision"]).toBe(before);
  });

  it.each([-1, 3])(
    "refuses to_index %i outside the row with a kind and a hint",
    async (toIndex) => {
      const harness = await harnessWithThreeScenes();

      const refused = await harness.call({
        name: "move_scene_clip",
        arguments: { clip_id: "two", to_index: toIndex },
      });

      expect(refused.isError).toBe(true);
      expect(refused.data["kind"]).toBe("index-out-of-range");
      expect(refused.data["hint"]).toContain("from 0 to 2");
    },
  );
});
