import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";
import { timelineOf } from "../testing/narrationFixture.js";

const script = "Meet Hoshi. Calm green tea for a slow afternoon.";

async function harnessWithVideo(options: { seconds: number }) {
  const harness = await startHarness({ withLocalVoice: true });
  await harness.call({
    name: "put_scene",
    arguments: {
      scene_id: "intro",
      title: "Intro",
      kit_component: "title-card",
      props: { heading: "Hoshi" },
    },
  });
  await harness.call({
    name: "set_timeline",
    arguments: {
      output_id: "wide",
      tracks: [
        {
          id: "main",
          kind: "scene",
          clips: [
            {
              scene_id: "intro",
              start_frame: 0,
              duration_frames: options.seconds * 30,
            },
          ],
        },
      ],
    },
  });
  return harness;
}

async function speak(options: {
  harness: Harness;
  assetId: string;
  text: string;
  server?: string;
}) {
  return options.harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: options.assetId,
      capability: "speech",
      ...(options.server === undefined ? {} : { server: options.server }),
      input: { text: options.text },
    },
  });
}

function placeVoice(options: {
  harness: Harness;
  assetId: string;
  partial?: boolean;
}) {
  return options.harness.call({
    name: "place_narration",
    arguments: {
      output_id: "wide",
      asset_id: options.assetId,
      start_frame: 0,
      with_captions: true,
      ...(options.partial === undefined ? {} : { partial: options.partial }),
    },
  });
}

describe("captions and an old voice", () => {
  it("refuses a narration of 8 seconds for a video of 15 seconds, and places it with partial true", async () => {
    const harness = await harnessWithVideo({ seconds: 15 });
    const words = Array.from({ length: 27 }, () => "tea").join(" ");
    await speak({ harness, assetId: "voice", text: words });

    const refused = await placeVoice({ harness, assetId: "voice" });
    const placed = await placeVoice({
      harness,
      assetId: "voice",
      partial: true,
    });

    expect(refused.data).toMatchObject({
      kind: "narration-too-short",
      message:
        "The voice is 8.1 seconds long and the video is 15 seconds long. A voice covers the whole video.",
    });
    expect(placed.isError).toBe(false);
  });

  it("spreads the words of a voice with no word times between its first and its last sound, so captions follow it", async () => {
    const harness = await harnessWithVideo({ seconds: 2 });
    await speak({ harness, assetId: "voice", text: script });

    const placed = await placeVoice({ harness, assetId: "voice" });
    const words = await harness.call({
      name: "get_asset_words",
      arguments: { asset_id: "voice" },
    });

    expect(placed.data).toMatchObject({ caption_clip_id: "captions-voice" });
    const timings = words.data["words"];
    if (!Array.isArray(timings)) throw new Error("No word timings");
    expect(timings).toHaveLength(9);
    expect(timings.at(0)).toMatchObject({ text: "Meet", start_frame: 6 });
    expect(timings.at(-1)).toMatchObject({ text: "afternoon.", end_frame: 75 });
  });

  it("gives no captions for a voice of the free test service", async () => {
    const harness = await harnessWithVideo({ seconds: 2 });
    await speak({ harness, assetId: "tone", text: script, server: "sample" });

    const placed = await placeVoice({ harness, assetId: "tone" });

    expect(placed.data["caption_clip_id"]).toBeUndefined();
    expect(placed.text).toContain("It has no captions");
    expect(timelineOf(harness).tracks.map((track) => track.id)).toEqual([
      "main",
      "narration",
    ]);
  });

  it("gives voice_matches_script false after a change of a spoken line, and an undo clears it", async () => {
    const harness = await harnessWithVideo({ seconds: 2 });
    await harness.call({ name: "set_script", arguments: { script } });
    await speak({ harness, assetId: "voice", text: script });
    await placeVoice({ harness, assetId: "voice" });
    const matches = async () =>
      (await harness.call({ name: "get_project" })).data[
        "voice_matches_script"
      ];

    const before = await matches();
    await harness.call({
      name: "set_script",
      arguments: { script: script.replace("slow", "lazy") },
    });
    const afterChange = await matches();
    await harness.call({ name: "undo" });

    expect([before, afterChange, await matches()]).toEqual([true, false, true]);
  });
});
