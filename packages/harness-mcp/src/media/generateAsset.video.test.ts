import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";
import { probeVideo } from "../testing/probeVideo.js";
import { generateVideo } from "../testing/videoFixture.js";

describe("generate_asset with the capability video", () => {
  it("passes the path of first_frame_asset_id as first_frame_path", async () => {
    const harness = await startHarness({ approvePicturesFirst: false });
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "still",
        capability: "image",
        input: { prompt: "a fox", width_pixels: 64, height_pixels: 36 },
      },
    });

    const result = await generateVideo({
      harness,
      assetId: "fox-run",
      seconds: 1,
      firstFrameAssetId: "still",
    });

    expect(result.isError).toBe(false);
    expect(harness.runRequests.at(-1)).toMatchObject({
      capability: "video",
      input: {
        prompt: "clip fox-run",
        duration_seconds: 1,
        first_frame_path: join(harness.folder, "assets", "files", "still.png"),
      },
    });
  });

  it("records hasAudio from the file and the length in project frames", async () => {
    const harness = await startHarness({ approvePicturesFirst: false });

    const withSound = await generateVideo({
      harness,
      assetId: "loud",
      seconds: 2,
    });
    await generateVideo({
      harness,
      assetId: "quiet",
      seconds: 1,
      withAudio: false,
    });

    expect(withSound.data).toMatchObject({
      kind: "video",
      duration_frames: 60,
      has_audio: true,
    });
    expect(harness.store.read().assets).toMatchObject([
      { id: "loud", kind: "video", durationFrames: 60, hasAudio: true },
      { id: "quiet", kind: "video", durationFrames: 30, hasAudio: false },
    ]);
    const streams = await probeVideo(
      join(harness.folder, "assets", "files", "quiet.mp4"),
    );
    expect(streams.map((stream) => stream.codec_type)).toEqual(["video"]);
  });

  it("shows has_audio for a video asset in list_assets", async () => {
    const harness = await startHarness({ approvePicturesFirst: false });
    await generateVideo({ harness, assetId: "loud", seconds: 1 });

    const listed = await harness.call({
      name: "list_assets",
      arguments: { kind: "video" },
    });

    expect(listed.data["assets"]).toMatchObject([
      { id: "loud", kind: "video", duration_frames: 30, has_audio: true },
    ]);
  });

  it("keeps hasAudio when a repeated request reuses the file under a new id", async () => {
    const harness = await startHarness({ approvePicturesFirst: false });
    await generateVideo({ harness, assetId: "loud", seconds: 1 });
    const requestsBefore = harness.runRequests.length;

    const reused = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "loud-again",
        capability: "video",
        input: { prompt: "clip loud", duration_seconds: 1 },
      },
    });

    expect(reused.data).toMatchObject({ reused: true, has_audio: true });
    expect(harness.runRequests).toHaveLength(requestsBefore);
    expect(harness.store.read().assets[1]).toMatchObject({
      id: "loud-again",
      hasAudio: true,
    });
  });
});
