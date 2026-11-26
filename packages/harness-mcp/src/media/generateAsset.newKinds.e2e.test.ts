import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";

describe("generate_asset with the new kinds", () => {
  it("makes a sound effect as an audio asset with its length in frames", async () => {
    const harness = await startHarness();

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "door",
        capability: "sound-effect",
        input: { prompt: "a door slams", duration_seconds: 0.5 },
      },
    });

    expect(result.isError).toBe(false);
    const asset = harness.store
      .read()
      .assets.find((each) => each.id === "door");
    expect(asset).toMatchObject({
      kind: "audio",
      durationFrames: 15,
      source: { kind: "tool", tool: "generate_sound_effect", server: "sample" },
    });
  });

  it("makes a sharper copy of a picture asset from media_asset_id and records the id", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "lake",
        capability: "image",
        input: { prompt: "a lake", width_pixels: 64, height_pixels: 48 },
      },
    });

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "lake-sharper",
        capability: "sharper",
        input: { scale: 4 },
        media_asset_id: "lake",
      },
    });

    expect(result.isError).toBe(false);
    const asset = harness.store
      .read()
      .assets.find((each) => each.id === "lake-sharper");
    expect(asset).toMatchObject({
      kind: "image",
      widthPixels: 256,
      heightPixels: 192,
      source: {
        tool: "sharpen_media",
        input: { scale: 4, media_asset_id: "lake" },
      },
    });
    const [request] = harness.runRequests.filter(
      (each) => each.capability === "sharper",
    );
    expect(request?.input["media_path"]).toMatch(/assets\/files\/lake\.png$/);
  });

  it("fails with the asset ids when a sharper copy names no media asset", async () => {
    const harness = await startHarness();

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "nothing",
        capability: "sharper",
        input: { scale: 2 },
      },
    });

    expect(result.data).toMatchObject({
      kind: "asset-not-found",
      message:
        "A sharper copy needs media_asset_id, the picture or the video clip to copy.",
    });
  });

  it("rejects media_asset_id for another capability", async () => {
    const harness = await startHarness();

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "song",
        capability: "music",
        input: { prompt: "calm", duration_seconds: 1 },
        media_asset_id: "lake",
      },
    });

    expect(result.data).toMatchObject({ kind: "invalid-value" });
    expect(harness.runRequests).toHaveLength(0);
  });
});
