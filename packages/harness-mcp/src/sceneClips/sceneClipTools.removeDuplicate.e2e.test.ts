import { describe, expect, it } from "vitest";
import {
  harnessWithThreeScenes,
  nonRowTracksOf,
  rowOf,
} from "../testing/sceneClipFixture.js";

describe("remove_scene_clip", () => {
  it("removes the clip in each output, moves later clips earlier, and keeps the scene", async () => {
    const harness = await harnessWithThreeScenes();
    const musicBefore = nonRowTracksOf({ harness, outputId: "wide" });

    const removed = await harness.call({
      name: "remove_scene_clip",
      arguments: { clip_id: "two" },
    });

    const expected = [
      ["one", "a", 0, 30],
      ["three", "c", 30, 40],
    ];
    expect(removed.data["output_ids"]).toEqual(["wide", "tall"]);
    expect(rowOf({ harness, outputId: "wide" })).toEqual(expected);
    expect(rowOf({ harness, outputId: "tall" })).toEqual(expected);
    expect(harness.store.read().scenes.map((scene) => scene.id)).toContain("b");
    expect(nonRowTracksOf({ harness, outputId: "wide" })).toEqual(musicBefore);
  });

  it("is one undo step for all outputs", async () => {
    const harness = await harnessWithThreeScenes();
    const before = harness.store.read().timelines;

    await harness.call({
      name: "remove_scene_clip",
      arguments: { clip_id: "one" },
    });
    await harness.call({ name: "undo" });

    expect(harness.store.read().timelines).toEqual(before);
  });
});

describe("duplicate_scene_clip", () => {
  it("copies the scene and puts a clip of the copy after the clip in each output", async () => {
    const harness = await harnessWithThreeScenes();

    const duplicated = await harness.call({
      name: "duplicate_scene_clip",
      arguments: { clip_id: "one" },
    });

    const expected = [
      ["one", "a", 0, 30],
      ["one-copy", "a-copy", 30, 30],
      ["two", "b", 60, 20],
      ["three", "c", 80, 40],
    ];
    const copy = harness.store
      .read()
      .scenes.find((scene) => scene.id === "a-copy");
    expect(duplicated.data).toMatchObject({
      clip_id: "one-copy",
      scene_ids: ["a-copy"],
      voice_may_not_match: false,
    });
    expect(rowOf({ harness, outputId: "wide" })).toEqual(expected);
    expect(rowOf({ harness, outputId: "tall" })).toEqual(expected);
    expect(copy).toEqual({
      id: "a-copy",
      title: "A (copy)",
      notes: "",
      source: { kind: "kit", component: "title-card", props: { heading: "A" } },
    });
  });

  it("gives a second copy a unique scene id and clip id", async () => {
    const harness = await harnessWithThreeScenes();
    await harness.call({
      name: "duplicate_scene_clip",
      arguments: { clip_id: "one" },
    });

    const second = await harness.call({
      name: "duplicate_scene_clip",
      arguments: { clip_id: "one" },
    });

    expect(second.data).toMatchObject({
      clip_id: "one-copy-2",
      scene_ids: ["a-copy-2"],
    });
  });

  it("is one undo step that removes the copy of the scene and the clips", async () => {
    const harness = await harnessWithThreeScenes();
    const before = harness.store.read();

    await harness.call({
      name: "duplicate_scene_clip",
      arguments: { clip_id: "three" },
    });
    await harness.call({ name: "undo" });

    const after = harness.store.read();
    expect(after.timelines).toEqual(before.timelines);
    expect(after.scenes).toEqual(before.scenes);
  });
});
