import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";
import { timelineOf } from "../testing/narrationFixture.js";
import { generateVideo } from "../testing/videoFixture.js";

async function harnessWithVideoAndSpeech(): Promise<Harness> {
  const harness = await startHarness();
  await generateVideo({ harness, assetId: "fox", seconds: 1 });
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "voice",
      capability: "speech",
      input: { text: "one two three" },
    },
  });
  return harness;
}

const placeFox = {
  name: "place_video",
  arguments: { output_id: "wide", asset_id: "fox", start_frame: 0 },
};

const placeVoice = {
  name: "place_narration",
  arguments: {
    output_id: "wide",
    asset_id: "voice",
    start_frame: 0,
    with_captions: true,
  },
};

function trackIdsOf(harness: Harness): string[] {
  return timelineOf(harness).tracks.map((track) => track.id);
}

describe("place_video together with place_narration", () => {
  it("keeps the narration off the video-sound track when the video comes first", async () => {
    const harness = await harnessWithVideoAndSpeech();

    await harness.call(placeFox);
    const narration = await harness.call(placeVoice);

    expect(narration.isError).toBe(false);
    expect(trackIdsOf(harness)).toEqual([
      "scenes",
      "video-sound",
      "captions",
      "narration",
    ]);
  });

  it("puts the video on a new scene track below the captions when the narration comes first", async () => {
    const harness = await harnessWithVideoAndSpeech();

    await harness.call(placeVoice);
    const video = await harness.call(placeFox);

    expect(video.isError).toBe(false);
    expect(video.data).toMatchObject({ scene_track_id: "scenes" });
    expect(trackIdsOf(harness)).toEqual([
      "scenes",
      "captions",
      "narration",
      "video-sound",
    ]);
  });
});
