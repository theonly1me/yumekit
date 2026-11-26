import { describe, expect, it } from "vitest";
import type { Harness } from "../testing/harnessFixture.js";
import { harnessWithSpeech, timelineOf } from "../testing/narrationFixture.js";
import { generateVideo } from "../testing/videoFixture.js";

function introClipId(harness: Harness): string {
  const [track] = timelineOf(harness).tracks;
  const [clip] = track?.clips ?? [];
  if (clip === undefined) throw new Error("The intro clip is missing");
  return clip.id;
}

function replace(options: {
  harness: Harness;
  assetId: string;
  clipId: string;
}) {
  return options.harness.call({
    name: "place_video",
    arguments: {
      output_id: "wide",
      asset_id: options.assetId,
      replace_clip_id: options.clipId,
    },
  });
}

describe("place_video with replace_clip_id", () => {
  it("puts the video in place of the scene clip with its start and length in one revision, and one undo brings the clip back", async () => {
    const harness = await harnessWithSpeech();
    await generateVideo({ harness, assetId: "fox", seconds: 1 });
    const before = timelineOf(harness);
    const revisionBefore = harness.store.read().revision;

    const result = await replace({
      harness,
      assetId: "fox",
      clipId: introClipId(harness),
    });

    expect(result.data).toMatchObject({
      scene_clip_id: "video-fox",
      start_frame: 0,
      duration_frames: 90,
      revision: revisionBefore + 1,
    });
    expect(timelineOf(harness).tracks[0]?.clips).toEqual([
      {
        id: "video-fox",
        sceneId: "video-fox",
        startFrame: 0,
        durationFrames: 90,
        sceneStartFrame: 0,
        madeBy: "ai",
      },
    ]);

    await harness.call({ name: "undo" });

    expect(timelineOf(harness)).toEqual(before);
  });

  it("keeps the title of the replaced scene, and a video with no scene to replace gets its label", async () => {
    const harness = await harnessWithSpeech();
    await generateVideo({ harness, assetId: "fox", seconds: 1 });
    await generateVideo({ harness, assetId: "owl", seconds: 1 });

    await replace({ harness, assetId: "fox", clipId: introClipId(harness) });
    await harness.call({
      name: "place_video",
      arguments: { output_id: "wide", asset_id: "owl", start_frame: 90 },
    });

    const titles = harness.store
      .read()
      .scenes.filter((scene) => scene.id.startsWith("video-"))
      .map((scene) => [scene.id, scene.title]);
    expect(titles).toEqual([
      ["video-fox", "Intro"],
      ["video-owl", "Clip owl"],
    ]);
    expect(
      harness.store.read().assets.find((asset) => asset.id === "owl")?.label,
    ).toBe("Clip owl");
  });

  it("removes the sound clip of a replaced video clip, so a second clip takes its place", async () => {
    const harness = await harnessWithSpeech();
    await generateVideo({ harness, assetId: "fox", seconds: 1 });
    await generateVideo({ harness, assetId: "owl", seconds: 2 });
    await replace({ harness, assetId: "fox", clipId: introClipId(harness) });

    const result = await replace({
      harness,
      assetId: "owl",
      clipId: "video-fox",
    });

    expect(result.isError).toBe(false);
    expect(
      timelineOf(harness).tracks.map((track) =>
        track.clips.map((clip) => clip.id),
      ),
    ).toEqual([["video-owl"], ["video-sound-owl"]]);
  });

  it("returns clip-not-found for a clip id that the output does not have, and changes nothing", async () => {
    const harness = await harnessWithSpeech();
    await generateVideo({ harness, assetId: "fox", seconds: 1 });
    const before = harness.store.read();

    const result = await replace({ harness, assetId: "fox", clipId: "nope" });

    expect(result.data).toMatchObject({ kind: "clip-not-found" });
    expect(result.data["hint"]).toContain(introClipId(harness));
    expect(harness.store.read()).toEqual(before);
  });

  it("changes nothing, and keeps the scene clip, when the video overlaps the next clip", async () => {
    const harness = await harnessWithSpeech();
    await generateVideo({ harness, assetId: "fox", seconds: 1 });
    await harness.call({
      name: "add_clip",
      arguments: {
        output_id: "wide",
        track_id: "main",
        scene_id: "intro",
        start_frame: 90,
        duration_frames: 30,
      },
    });
    const before = harness.store.read();

    const result = await harness.call({
      name: "place_video",
      arguments: {
        output_id: "wide",
        asset_id: "fox",
        replace_clip_id: introClipId(harness),
        duration_frames: 120,
      },
    });

    expect(result.data).toMatchObject({ kind: "clips-overlap" });
    expect(harness.store.read()).toEqual(before);
  });

  it("asks for start_frame or replace_clip_id when neither is given", async () => {
    const harness = await harnessWithSpeech();
    await generateVideo({ harness, assetId: "fox", seconds: 1 });

    const result = await harness.call({
      name: "place_video",
      arguments: { output_id: "wide", asset_id: "fox" },
    });

    expect(result.data).toMatchObject({ kind: "invalid-input" });
  });
});
