import { describe, expect, it } from "vitest";
import { harnessWithSpeech, timelineOf } from "../testing/narrationFixture.js";
import { generateVideo } from "../testing/videoFixture.js";

describe("place_video tracks and failures", () => {
  it("uses the first scene track and the existing scene with no change to its props", async () => {
    const harness = await harnessWithSpeech();
    await generateVideo({ harness, assetId: "fox", seconds: 1 });
    await harness.call({
      name: "put_scene",
      arguments: {
        scene_id: "video-fox",
        title: "Fox",
        kit_component: "video-clip",
        props: { assetId: "fox", caption: "A fox" },
      },
    });

    const result = await harness.call({
      name: "place_video",
      arguments: { output_id: "wide", asset_id: "fox", start_frame: 90 },
    });

    expect(result.data).toMatchObject({ scene_track_id: "main" });
    expect(
      harness.store.read().scenes.find((scene) => scene.id === "video-fox")
        ?.source,
    ).toMatchObject({ props: { assetId: "fox", caption: "A fox" } });
    expect(timelineOf(harness).tracks.map((track) => track.id)).toEqual([
      "main",
      "video-sound",
    ]);
  });

  it("returns asset-not-video for an asset that is not a video", async () => {
    const harness = await harnessWithSpeech();

    const result = await harness.call({
      name: "place_video",
      arguments: { output_id: "wide", asset_id: "line-one", start_frame: 0 },
    });

    expect(result.data).toMatchObject({ kind: "asset-not-video" });
    expect(result.data["hint"]).toContain('capability "video"');
  });

  it("returns clips-overlap with a hint that names the track, and changes nothing", async () => {
    const harness = await harnessWithSpeech();
    await generateVideo({ harness, assetId: "fox", seconds: 1 });
    const before = timelineOf(harness);

    const result = await harness.call({
      name: "place_video",
      arguments: { output_id: "wide", asset_id: "fox", start_frame: 10 },
    });

    expect(result.data).toMatchObject({ kind: "clips-overlap" });
    expect(result.data["hint"]).toContain('"main"');
    expect(timelineOf(harness)).toEqual(before);
    expect(harness.store.read().scenes.map((scene) => scene.id)).toEqual([
      "intro",
    ]);
  });
});
