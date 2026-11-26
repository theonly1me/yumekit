import { describe, expect, it } from "vitest";
import type { Harness } from "../testing/harnessFixture.js";
import { harnessWithThreeScenes } from "../testing/sceneClipFixture.js";

function transitionsOf(options: { harness: Harness; outputId: string }) {
  const timeline = options.harness.store
    .read()
    .timelines.find((candidate) => candidate.outputId === options.outputId);
  const row = timeline?.tracks.find((track) => track.id === "main");
  if (row?.kind !== "scene") throw new Error("The output has no scenes row");
  return row.clips.map((clip) => [clip.id, clip.transition?.kind]);
}

function rowOf(transitionOfTwo?: { kind: string }) {
  return {
    id: "main",
    kind: "scene",
    clips: [
      { id: "one", scene_id: "a", start_frame: 0, duration_frames: 30 },
      {
        id: "two",
        scene_id: "b",
        start_frame: 30,
        duration_frames: 20,
        ...(transitionOfTwo === undefined
          ? {}
          : { transition: transitionOfTwo }),
      },
      { id: "three", scene_id: "c", start_frame: 50, duration_frames: 60 },
    ],
  };
}

async function harnessWithSlides(): Promise<Harness> {
  const harness = await harnessWithThreeScenes();
  await harness.call({ name: "set_transitions", arguments: { kind: "slide" } });
  return harness;
}

describe("what a timeline tool keeps", () => {
  it("set_timeline with the same clip ids keeps each slide and says how many it kept", async () => {
    const harness = await harnessWithSlides();

    const result = await harness.call({
      name: "set_timeline",
      arguments: { output_id: "wide", tracks: [rowOf()] },
    });

    expect(transitionsOf({ harness, outputId: "wide" })).toEqual([
      ["one", undefined],
      ["two", "slide"],
      ["three", "slide"],
    ]);
    expect(result.data).toMatchObject({ kept_transitions: 2 });
    expect(result.text).toContain(
      "It kept 2 transitions that the call did not name.",
    );
  });

  it("set_timeline removes a transition that the call gives as cut, and sets one that it names", async () => {
    const harness = await harnessWithSlides();
    const tracks = [rowOf({ kind: "cut" })];
    const [row] = tracks;
    const three = row?.clips[2];
    if (three === undefined) throw new Error("The row has no third clip");
    Object.assign(three, { transition: { kind: "fade" } });

    const result = await harness.call({
      name: "set_timeline",
      arguments: { output_id: "wide", tracks },
    });

    expect(transitionsOf({ harness, outputId: "wide" })).toEqual([
      ["one", undefined],
      ["two", undefined],
      ["three", "fade"],
    ]);
    expect(result.data).toMatchObject({ kept_transitions: 0 });
  });

  it("copy_timeline keeps the transitions of the target for the clips with the same id", async () => {
    const harness = await harnessWithSlides();
    await harness.call({
      name: "set_timeline",
      arguments: { output_id: "wide", tracks: [rowOf({ kind: "cut" })] },
    });

    const result = await harness.call({
      name: "copy_timeline",
      arguments: { from_output_id: "wide", to_output_id: "tall" },
    });

    expect(transitionsOf({ harness, outputId: "tall" })).toEqual([
      ["one", undefined],
      ["two", "slide"],
      ["three", "slide"],
    ]);
    expect(result.data).toMatchObject({ kept_transitions: 1 });
  });
});
