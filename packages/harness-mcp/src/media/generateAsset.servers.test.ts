import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  sampleServerCommand,
  startHarness,
} from "../testing/harnessFixture.js";

const twoImageServers = {
  mcpServers: { sample: {}, "second-sample": sampleServerCommand },
  defaults: { image: "second-sample" },
};

const foxImage = {
  capability: "image",
  input: { prompt: "a fox", width_pixels: 64, height_pixels: 48 },
};

describe("generate_asset servers and references", () => {
  it("uses the configured default server when the call gives no server, and records it", async () => {
    const harness = await startHarness({ mediaToolsFile: twoImageServers });

    const result = await harness.call({
      name: "generate_asset",
      arguments: { asset_id: "fox", ...foxImage },
    });

    expect(result.isError).toBe(false);
    expect(result.text).toContain("made by second-sample");
    expect(harness.store.read().assets[0]?.source).toMatchObject({
      kind: "tool",
      server: "second-sample",
    });
    expect(harness.runRequests.map((request) => request.server)).toEqual([
      undefined,
    ]);
  });

  it("gives the tool the absolute paths of the reference images and the first frame", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "generate_asset",
      arguments: { asset_id: "fox", ...foxImage },
    });

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "fox-again",
        capability: "image",
        input: { prompt: "the same fox, running" },
        reference_asset_ids: ["fox"],
        first_frame_asset_id: "fox",
      },
    });

    const foxPath = join(harness.folder, "assets", "files", "fox.png");
    expect(result.isError).toBe(false);
    expect(harness.runRequests.at(-1)?.input).toEqual({
      prompt: "the same fox, running",
      reference_image_paths: [foxPath],
      first_frame_path: foxPath,
    });
    expect(harness.store.read().assets[1]?.source).toMatchObject({
      input: {
        prompt: "the same fox, running",
        reference_asset_ids: ["fox"],
        first_frame_asset_id: "fox",
      },
    });
  });

  it("returns not-found for a reference that is not an image asset, before it calls the tool", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "voice",
        capability: "speech",
        input: { text: "hi" },
      },
    });
    const requestsBefore = harness.runRequests.length;

    const audioReference = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "fox",
        ...foxImage,
        reference_asset_ids: ["voice"],
      },
    });
    const missingFirstFrame = await harness.call({
      name: "generate_asset",
      arguments: { asset_id: "fox", ...foxImage, first_frame_asset_id: "none" },
    });

    expect(audioReference.data).toMatchObject({ kind: "not-found" });
    expect(audioReference.data["message"]).toContain("voice");
    expect(missingFirstFrame.data).toMatchObject({ kind: "not-found" });
    expect(missingFirstFrame.data["hint"]).toContain("generate_asset");
    expect(harness.runRequests).toHaveLength(requestsBefore);
  });
});
