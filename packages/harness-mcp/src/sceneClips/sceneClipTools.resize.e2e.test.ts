import { describe, expect, it } from "vitest";
import {
  harnessWithThreeScenes,
  nonRowTracksOf,
  rowOf,
} from "../testing/sceneClipFixture.js";

describe("resize_scene_clip", () => {
  it("sets the length in each output and moves each later clip by the difference", async () => {
    const harness = await harnessWithThreeScenes();

    const resized = await harness.call({
      name: "resize_scene_clip",
      arguments: { clip_id: "two", duration_frames: 35 },
    });

    const expected = [
      ["one", "a", 0, 30],
      ["two", "b", 30, 35],
      ["three", "c", 65, 40],
    ];
    expect(resized.isError).toBe(false);
    expect(resized.data).toMatchObject({
      output_ids: ["wide", "tall"],
      voice_may_not_match: false,
    });
    expect(rowOf({ harness, outputId: "wide" })).toEqual(expected);
    expect(rowOf({ harness, outputId: "tall" })).toEqual(expected);
  });

  it("is one undo step for all outputs, and keeps the music in its place", async () => {
    const harness = await harnessWithThreeScenes();
    const before = harness.store.read().timelines;
    const musicBefore = nonRowTracksOf({ harness, outputId: "tall" });

    await harness.call({
      name: "resize_scene_clip",
      arguments: { clip_id: "one", duration_frames: 10 },
    });
    const musicAfter = nonRowTracksOf({ harness, outputId: "tall" });
    await harness.call({ name: "undo" });

    expect(musicAfter).toEqual(musicBefore);
    expect(harness.store.read().timelines).toEqual(before);
  });

  it("changes only the outputs of output_ids", async () => {
    const harness = await harnessWithThreeScenes();
    const wideBefore = rowOf({ harness, outputId: "wide" });

    await harness.call({
      name: "resize_scene_clip",
      arguments: { output_ids: ["tall"], clip_id: "one", duration_frames: 10 },
    });

    expect(rowOf({ harness, outputId: "wide" })).toEqual(wideBefore);
    expect(rowOf({ harness, outputId: "tall" })).toEqual([
      ["one", "a", 0, 10],
      ["two", "b", 10, 20],
      ["three", "c", 30, 40],
    ]);
  });

  it("reports voice_may_not_match when an output has a voice clip, and keeps the voice and the captions in place", async () => {
    const harness = await harnessWithThreeScenes({ withVoice: true });
    const soundBefore = nonRowTracksOf({ harness, outputId: "wide" });

    const resized = await harness.call({
      name: "resize_scene_clip",
      arguments: { clip_id: "one", duration_frames: 60 },
    });

    expect(resized.data["voice_may_not_match"]).toBe(true);
    expect(resized.text).toContain("The voice may not match the scenes now.");
    expect(nonRowTracksOf({ harness, outputId: "wide" })).toEqual(soundBefore);
  });

  it("refuses a length under 1 frame with a kind and a hint", async () => {
    const harness = await harnessWithThreeScenes();
    const before = harness.store.read().revision;

    const refused = await harness.call({
      name: "resize_scene_clip",
      arguments: { clip_id: "one", duration_frames: 0 },
    });

    expect(refused.isError).toBe(true);
    expect(refused.data["kind"]).toBe("invalid-duration");
    expect(refused.data["hint"]).toContain("remove_scene_clip");
    expect(harness.store.read().revision).toBe(before);
  });
});
