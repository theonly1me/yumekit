import { describe, expect, it } from "vitest";
import { harnessWithSpeech, timelineOf } from "../testing/narrationFixture.js";
import type { Harness } from "../testing/harnessFixture.js";

async function makeSound(options: {
  harness: Harness;
  assetId: string;
  seconds: number;
}) {
  return options.harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: options.assetId,
      capability: "sound-effect",
      input: { prompt: "a door slams", duration_seconds: options.seconds },
    },
  });
}

describe("place_sound", () => {
  it("adds the sounds track below the others with a clip of the length of the sound", async () => {
    const harness = await harnessWithSpeech();
    const made = await makeSound({ harness, assetId: "door", seconds: 1 });
    expect(made.data).toMatchObject({ duration_frames: 30 });

    const result = await harness.call({
      name: "place_sound",
      arguments: { output_id: "wide", asset_id: "door", start_frame: 20 },
    });

    expect(result.data).toMatchObject({
      track_id: "sounds",
      clip_id: "sound-door",
      start_frame: 20,
      duration_frames: 30,
      end_frame: 50,
    });
    const tracks = timelineOf(harness).tracks;
    expect(tracks.map((track) => [track.id, track.kind])).toEqual([
      ["main", "scene"],
      ["sounds", "audio"],
    ]);
    expect(tracks[1]?.clips).toEqual([
      {
        id: "sound-door",
        assetId: "door",
        startFrame: 20,
        durationFrames: 30,
        assetStartFrame: 0,
        gainDecibels: -6,
        madeBy: "ai",
      },
    ]);
  });

  it("puts a sound that plays at the same time as another on a second sounds track", async () => {
    const harness = await harnessWithSpeech();
    await makeSound({ harness, assetId: "door", seconds: 1 });
    await makeSound({ harness, assetId: "bell", seconds: 2 });
    await harness.call({
      name: "place_sound",
      arguments: { output_id: "wide", asset_id: "door", start_frame: 20 },
    });

    const result = await harness.call({
      name: "place_sound",
      arguments: { output_id: "wide", asset_id: "bell", start_frame: 40 },
    });

    expect(result.data).toMatchObject({ track_id: "sounds-2" });
  });

  it("stops the sound at the end of the last scene, so the video keeps its length", async () => {
    const harness = await harnessWithSpeech();
    await makeSound({ harness, assetId: "bell", seconds: 2 });

    const result = await harness.call({
      name: "place_sound",
      arguments: { output_id: "wide", asset_id: "bell", start_frame: 70 },
    });

    expect(result.data).toMatchObject({ duration_frames: 20, end_frame: 90 });
  });

  it("keeps the narration off the sounds track", async () => {
    const harness = await harnessWithSpeech();
    await makeSound({ harness, assetId: "door", seconds: 1 });
    await harness.call({
      name: "place_sound",
      arguments: { output_id: "wide", asset_id: "door", start_frame: 0 },
    });

    const result = await harness.call({
      name: "place_narration",
      arguments: {
        output_id: "wide",
        asset_id: "line-one",
        start_frame: 0,
        partial: true,
        with_captions: false,
      },
    });

    expect(result.isError).toBe(false);
    expect(timelineOf(harness).tracks.map((track) => track.id)).toEqual([
      "main",
      "sounds",
      "narration",
    ]);
  });

  it("fails with a hint for a start after the last scene", async () => {
    const harness = await harnessWithSpeech();
    await makeSound({ harness, assetId: "door", seconds: 1 });

    const result = await harness.call({
      name: "place_sound",
      arguments: { output_id: "wide", asset_id: "door", start_frame: 95 },
    });

    expect(result.isError).toBe(true);
    expect(result.data).toMatchObject({
      kind: "start-after-the-end",
      hint: "Choose a start_frame below 90.",
    });
  });
});
