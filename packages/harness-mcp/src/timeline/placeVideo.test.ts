import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";
import { timelineOf } from "../testing/narrationFixture.js";
import { generateVideo } from "../testing/videoFixture.js";

async function revisionOf(harness: Harness): Promise<unknown> {
  return (await harness.call({ name: "get_project" })).data["revision"];
}

function placeVideo(options: {
  harness: Harness;
  assetId: string;
  extra?: Record<string, unknown>;
}) {
  return options.harness.call({
    name: "place_video",
    arguments: {
      output_id: "wide",
      asset_id: options.assetId,
      start_frame: 6,
      ...options.extra,
    },
  });
}

describe("place_video", () => {
  it("adds one scene, one scene clip, and one sound clip in one revision", async () => {
    const harness = await startHarness();
    await generateVideo({ harness, assetId: "fox", seconds: 1 });
    const revisionBefore = await revisionOf(harness);

    const result = await placeVideo({
      harness,
      assetId: "fox",
      extra: { focus: { x: 0.2, y: 0.5 } },
    });

    expect(result.data).toMatchObject({
      scene_id: "video-fox",
      scene_clip_id: "video-fox",
      sound_clip_id: "video-sound-fox",
      end_frame: 36,
      revision: Number(revisionBefore) + 1,
    });
    expect(harness.store.read().scenes).toEqual([
      expect.objectContaining({
        id: "video-fox",
        source: {
          kind: "kit",
          component: "video-clip",
          props: { assetId: "fox", focus: { x: 0.2, y: 0.5 } },
        },
      }),
    ]);
    expect(timelineOf(harness).tracks).toEqual([
      {
        id: "scenes",
        kind: "scene",
        clips: [
          {
            id: "video-fox",
            sceneId: "video-fox",
            startFrame: 6,
            durationFrames: 30,
            sceneStartFrame: 0,
            madeBy: "ai",
          },
        ],
        madeBy: "ai",
      },
      {
        id: "video-sound",
        kind: "audio",
        clips: [
          {
            id: "video-sound-fox",
            assetId: "fox",
            startFrame: 6,
            durationFrames: 30,
            assetStartFrame: 0,
            gainDecibels: -12,
            madeBy: "ai",
          },
        ],
        madeBy: "ai",
      },
    ]);
  });

  it("removes the scene and both clips with one undo", async () => {
    const harness = await startHarness();
    await generateVideo({ harness, assetId: "fox", seconds: 1 });
    const before = timelineOf(harness);

    await placeVideo({ harness, assetId: "fox" });
    await harness.call({ name: "undo" });

    expect(timelineOf(harness)).toEqual(before);
    expect(harness.store.read().scenes).toEqual([]);
  });

  it("keeps the sound clip to the length of the video when the clip holds the last picture", async () => {
    const harness = await startHarness();
    await generateVideo({ harness, assetId: "fox", seconds: 1 });

    await placeVideo({
      harness,
      assetId: "fox",
      extra: { duration_frames: 45, sound_gain_decibels: -6 },
    });

    const [sceneTrack, soundTrack] = timelineOf(harness).tracks;
    expect(sceneTrack?.clips[0]).toMatchObject({ durationFrames: 45 });
    expect(soundTrack?.clips[0]).toMatchObject({
      durationFrames: 30,
      gainDecibels: -6,
    });
  });

  it("adds no sound clip when sound_gain_decibels is off", async () => {
    const harness = await startHarness();
    await generateVideo({ harness, assetId: "fox", seconds: 1 });

    const result = await placeVideo({
      harness,
      assetId: "fox",
      extra: { sound_gain_decibels: "off" },
    });

    expect(result.data["sound_clip_id"]).toBeUndefined();
    expect(timelineOf(harness).tracks.map((track) => track.id)).toEqual([
      "scenes",
    ]);
  });

  it("adds no sound clip for a video without sound", async () => {
    const harness = await startHarness();
    await generateVideo({
      harness,
      assetId: "quiet",
      seconds: 1,
      withAudio: false,
    });

    const result = await placeVideo({ harness, assetId: "quiet" });

    expect(result.isError).toBe(false);
    expect(result.text).toContain("with no sound clip");
    expect(timelineOf(harness).tracks.map((track) => track.id)).toEqual([
      "scenes",
    ]);
  });
});
