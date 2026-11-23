import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";
import { timelineOf } from "../testing/narrationFixture.js";
import { generateVideo } from "../testing/videoFixture.js";

async function harnessWithNarration(): Promise<Harness> {
  const harness = await startHarness();
  await generateVideo({ harness, assetId: "talk", seconds: 1 });
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "voice",
      capability: "speech",
      input: { text: "one two three four five six seven eight nine ten" },
    },
  });
  await harness.call({
    name: "place_narration",
    arguments: { output_id: "wide", asset_id: "voice", start_frame: 0 },
  });
  return harness;
}

function voiceClipsOf(harness: Harness) {
  const track = timelineOf(harness).tracks.find(
    (candidate) => candidate.id === "narration",
  );
  return (track?.clips ?? []).map((clip) => ({
    startFrame: clip.startFrame,
    durationFrames: clip.durationFrames,
    ...("assetStartFrame" in clip
      ? {
          assetStartFrame: clip.assetStartFrame,
          gainDecibels: clip.gainDecibels,
        }
      : {}),
  }));
}

function placeTalk(options: {
  harness: Harness;
  quietVoice: boolean;
  soundGain?: number | "off";
}) {
  return options.harness.call({
    name: "place_video",
    arguments: {
      output_id: "wide",
      asset_id: "talk",
      start_frame: 30,
      sound_gain_decibels: options.soundGain ?? 0,
      quiet_voice: options.quietVoice,
    },
  });
}

describe("place_video with quiet_voice", () => {
  it("turns down only the part of the voice under the sound of the video, in one undo step", async () => {
    const harness = await harnessWithNarration();

    const placed = await placeTalk({ harness, quietVoice: true });

    expect(placed.isError).toBe(false);
    expect(voiceClipsOf(harness)).toEqual([
      {
        startFrame: 0,
        durationFrames: 30,
        assetStartFrame: 0,
        gainDecibels: 0,
      },
      {
        startFrame: 30,
        durationFrames: 30,
        assetStartFrame: 30,
        gainDecibels: -90,
      },
      {
        startFrame: 60,
        durationFrames: 30,
        assetStartFrame: 60,
        gainDecibels: 0,
      },
    ]);

    await harness.call({ name: "undo" });

    expect(voiceClipsOf(harness)).toEqual([
      {
        startFrame: 0,
        durationFrames: 90,
        assetStartFrame: 0,
        gainDecibels: 0,
      },
    ]);
  });

  it("brings the voice back when another video replaces the talking clip", async () => {
    const harness = await harnessWithNarration();
    const placed = await placeTalk({ harness, quietVoice: true });

    await harness.call({
      name: "place_video",
      arguments: {
        output_id: "wide",
        asset_id: "talk",
        replace_clip_id: String(placed.data["scene_clip_id"]),
      },
    });

    expect(voiceClipsOf(harness).map((clip) => clip.gainDecibels)).toEqual([
      0, 0, 0,
    ]);
  });

  it("keeps the voice when the video adds no sound", async () => {
    const harness = await harnessWithNarration();

    await placeTalk({ harness, quietVoice: true, soundGain: "off" });

    expect(voiceClipsOf(harness)).toEqual([
      {
        startFrame: 0,
        durationFrames: 90,
        assetStartFrame: 0,
        gainDecibels: 0,
      },
    ]);
  });
});
