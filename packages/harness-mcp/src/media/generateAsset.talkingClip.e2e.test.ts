import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";
import { sampleWithVideoLimit } from "../testing/videoFixture.js";

async function personAndVoice(harness: Harness) {
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "face",
      capability: "image",
      input: { prompt: "a face", width_pixels: 64, height_pixels: 48 },
    },
  });
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "voice",
      capability: "speech",
      input: { text: "one two three four five six seven eight nine ten" },
    },
  });
}

function talk(options: { harness: Harness; voicePart?: object }) {
  return options.harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "face-talking",
      capability: "talking-clip",
      input: {},
      media_asset_id: "face",
      voice_asset_id: "voice",
      ...(options.voicePart === undefined
        ? {}
        : { voice_part: options.voicePart }),
    },
  });
}

describe("generate_asset with the capability talking-clip", () => {
  it("makes a video asset with sound from the picture and the whole voice file", async () => {
    const harness = await startHarness();
    await personAndVoice(harness);

    const result = await talk({ harness });

    expect(result.isError).toBe(false);
    expect(result.data).toMatchObject({
      kind: "video",
      duration_frames: 90,
      has_audio: true,
    });
    const [request] = harness.runRequests.filter(
      (each) => each.capability === "talking-clip",
    );
    expect(request?.input).toMatchObject({
      media_path: join(harness.folder, "assets", "files", "face.png"),
      audio_path: join(harness.folder, "assets", "files", "voice.wav"),
    });
    const asset = harness.store
      .read()
      .assets.find((each) => each.id === "face-talking");
    expect(asset?.source).toMatchObject({
      tool: "generate_talking_clip",
      input: { media_asset_id: "face", voice_asset_id: "voice" },
    });
  });

  it("cuts the voice part with its lead silence and sends only that part", async () => {
    const harness = await startHarness();
    await personAndVoice(harness);

    const result = await talk({
      harness,
      voicePart: { start_seconds: 1, duration_seconds: 1.5, lead_seconds: 0.5 },
    });

    expect(result.data).toMatchObject({ duration_frames: 60 });
    const [request] = harness.runRequests.filter(
      (each) => each.capability === "talking-clip",
    );
    const voicePath = join(harness.folder, ".cache", "voice-parts");
    expect(request?.input["audio_path"]).toBe(
      join(voicePath, "face-talking.wav"),
    );
  });

  it("counts the seconds of the voice toward the limit of generated video", async () => {
    const harness = await startHarness({
      mediaToolsFile: sampleWithVideoLimit(2),
    });
    await personAndVoice(harness);

    const result = await talk({ harness });

    expect(result.data).toMatchObject({
      kind: "generated-video-limit-reached",
      used_seconds: 0,
      requested_seconds: 3,
      limit_seconds: 2,
    });
    expect(
      harness.runRequests.filter((each) => each.capability === "talking-clip"),
    ).toHaveLength(0);
  });

  it("fails with the audio ids when the call names no voice", async () => {
    const harness = await startHarness();
    await personAndVoice(harness);

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "face-talking",
        capability: "talking-clip",
        input: {},
        media_asset_id: "face",
      },
    });

    expect(result.data).toMatchObject({
      kind: "asset-not-found",
      message:
        "A talking clip needs voice_asset_id, the voice that the person speaks.",
      hint: "Use one of these audio asset ids: voice.",
    });
  });

  it("rejects a voice part that ends after the voice file", async () => {
    const harness = await startHarness();
    await personAndVoice(harness);

    const result = await talk({
      harness,
      voicePart: { start_seconds: 2, duration_seconds: 2 },
    });

    expect(result.data).toMatchObject({ kind: "invalid-value" });
  });

  it("rejects voice_asset_id for another capability", async () => {
    const harness = await startHarness();

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "song",
        capability: "music",
        input: { prompt: "calm", duration_seconds: 1 },
        voice_asset_id: "voice",
      },
    });

    expect(result.data).toMatchObject({ kind: "invalid-value" });
    expect(harness.runRequests).toHaveLength(0);
  });
});
