import { describe, expect, it } from "vitest";
import type { Harness } from "../testing/harnessFixture.js";
import {
  harnessWithThreeScenes,
  nonRowTracksOf,
} from "../testing/sceneClipFixture.js";

function transitionsOf(options: { harness: Harness; outputId: string }) {
  const timeline = options.harness.store
    .read()
    .timelines.find((candidate) => candidate.outputId === options.outputId);
  const row = timeline?.tracks.find((track) => track.id === "main");
  if (row?.kind !== "scene") throw new Error("The output has no scenes row");
  return row.clips.map((clip) => [clip.id, clip.transition]);
}

const fadeOf12Frames = { kind: "fade", durationFrames: 12 };

describe("set_transitions", () => {
  it("sets the kind on each scene after the first, in each output, with 0.4 seconds as the default length", async () => {
    const harness = await harnessWithThreeScenes();
    const soundBefore = nonRowTracksOf({ harness, outputId: "wide" });

    const result = await harness.call({
      name: "set_transitions",
      arguments: { kind: "fade" },
    });

    expect(result.data).toMatchObject({
      kind: "fade",
      duration_frames: 12,
      outputs: [
        { output_id: "wide", clip_ids: ["two", "three"] },
        { output_id: "tall", clip_ids: ["two", "three"] },
      ],
    });
    for (const outputId of ["wide", "tall"]) {
      expect(transitionsOf({ harness, outputId })).toEqual([
        ["one", undefined],
        ["two", fadeOf12Frames],
        ["three", fadeOf12Frames],
      ]);
    }
    expect(nonRowTracksOf({ harness, outputId: "wide" })).toEqual(soundBefore);
  });

  it("removes each transition with cut, and one undo brings them back in each output", async () => {
    const harness = await harnessWithThreeScenes();
    await harness.call({
      name: "set_transitions",
      arguments: { kind: "slide", duration_frames: 6 },
    });
    const withSlides = harness.store.read().timelines;

    await harness.call({ name: "set_transitions", arguments: { kind: "cut" } });
    const afterCut = transitionsOf({ harness, outputId: "tall" });
    await harness.call({ name: "undo" });

    expect(afterCut).toEqual([
      ["one", undefined],
      ["two", undefined],
      ["three", undefined],
    ]);
    expect(harness.store.read().timelines).toEqual(withSlides);
  });

  it("changes only the clips of clip_ids, and refuses a first clip with a hint", async () => {
    const harness = await harnessWithThreeScenes();

    await harness.call({
      name: "set_transitions",
      arguments: { kind: "zoom", clip_ids: ["three"], output_ids: ["wide"] },
    });
    const refused = await harness.call({
      name: "set_transitions",
      arguments: { kind: "wipe", clip_ids: ["one"] },
    });

    expect(transitionsOf({ harness, outputId: "wide" })).toEqual([
      ["one", undefined],
      ["two", undefined],
      ["three", { kind: "zoom", durationFrames: 12 }],
    ]);
    expect(transitionsOf({ harness, outputId: "tall" })[2]).toEqual([
      "three",
      undefined,
    ]);
    expect(refused.isError).toBe(true);
    expect(refused.data).toMatchObject({ kind: "clip-not-found" });
    expect(String(refused.data["hint"])).toContain("get_timeline");
  });

  it("get_timeline shows a transition, and update_clip with cut removes it", async () => {
    const harness = await harnessWithThreeScenes();
    await harness.call({
      name: "update_clip",
      arguments: {
        output_id: "wide",
        clip_id: "two",
        transition: { kind: "wipe", duration_frames: 8 },
      },
    });
    const timeline = await harness.call({
      name: "get_timeline",
      arguments: { output_id: "wide" },
    });
    await harness.call({
      name: "update_clip",
      arguments: {
        output_id: "wide",
        clip_id: "two",
        transition: { kind: "cut" },
      },
    });

    expect(JSON.stringify(timeline.data)).toContain(
      '"transition":{"kind":"wipe","duration_frames":8}',
    );
    expect(transitionsOf({ harness, outputId: "wide" })[1]).toEqual([
      "two",
      undefined,
    ]);
  });
});
