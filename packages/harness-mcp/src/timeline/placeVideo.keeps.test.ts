import { describe, expect, it } from "vitest";
import { harnessWithThreeScenes } from "../testing/sceneClipFixture.js";
import { generateVideo } from "../testing/videoFixture.js";

describe("place_video in place of a clip", () => {
  it("keeps the transition and the place of the replaced clip", async () => {
    const harness = await harnessWithThreeScenes();
    await harness.call({
      name: "set_transitions",
      arguments: { kind: "slide" },
    });
    await generateVideo({ harness, assetId: "fox", seconds: 1 });

    await harness.call({
      name: "place_video",
      arguments: { output_id: "wide", asset_id: "fox", replace_clip_id: "two" },
    });

    const [timeline] = harness.store.read().timelines;
    const row = timeline?.tracks.find((track) => track.id === "main");
    expect(
      row?.clips.map((clip) => [
        clip.id,
        clip.startFrame,
        "sceneId" in clip ? clip.transition?.kind : undefined,
      ]),
    ).toEqual([
      ["one", 0, undefined],
      ["video-fox", 30, "slide"],
      ["three", 50, "slide"],
    ]);
  });
});
