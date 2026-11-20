import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";

const speechRequest = {
  capability: "speech",
  input: { text: "one two three four" },
};

describe("media tools", () => {
  it("generate_asset converts seconds to frames and records the server, the tool, and the input", async () => {
    const harness = await startHarness();

    const result = await harness.call({
      name: "generate_asset",
      arguments: { asset_id: "voice", ...speechRequest },
    });

    expect(result.data).toEqual({
      asset_id: "voice",
      kind: "audio",
      file: "assets/files/voice.wav",
      duration_frames: 36,
      has_words: true,
      reused: false,
      revision: 1,
    });
    const [asset] = harness.store.read().assets;
    expect(asset).toMatchObject({
      id: "voice",
      durationFrames: 36,
      hasWords: true,
      source: {
        kind: "tool",
        server: "sample",
        tool: "generate_speech",
        input: { text: "one two three four" },
      },
    });
  });

  it("generate_asset stores the size of an image", async () => {
    const harness = await startHarness();

    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "picture",
        capability: "image",
        input: { prompt: "a fox", width_pixels: 64, height_pixels: 48 },
      },
    });

    expect(harness.store.read().assets[0]).toMatchObject({
      kind: "image",
      file: "assets/files/picture.png",
      widthPixels: 64,
      heightPixels: 48,
    });
  });

  it("generate_asset reuses the file of an asset with the same capability, server, and input", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "generate_asset",
      arguments: { asset_id: "voice", ...speechRequest },
    });
    const revision = harness.store.read().revision;

    const again = await harness.call({
      name: "generate_asset",
      arguments: { asset_id: "voice", ...speechRequest },
    });
    const copy = await harness.call({
      name: "generate_asset",
      arguments: { asset_id: "voice-copy", server: "sample", ...speechRequest },
    });

    expect(again.data).toMatchObject({ reused: true, asset_id: "voice" });
    expect(copy.data).toMatchObject({
      reused: true,
      asset_id: "voice-copy",
      file: "assets/files/voice.wav",
      has_words: true,
    });
    expect(harness.store.read().revision).toBe(revision + 1);
    expect(
      await readdir(join(harness.folder, "assets", "files")),
    ).not.toContain("voice-copy.wav");
    const words = await harness.store.readAssetWords("voice-copy");
    expect(words.ok && words.value.words).toHaveLength(4);
  });

  it("align_words stores word timings in frames for audio without words", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "tune",
        capability: "music",
        input: { prompt: "calm", duration_seconds: 1 },
      },
    });

    const result = await harness.call({
      name: "align_words",
      arguments: { asset_id: "tune", text: "hello world" },
    });

    expect(result.data).toMatchObject({ asset_id: "tune", word_count: 2 });
    expect(await harness.store.readAssetWords("tune")).toEqual({
      ok: true,
      value: {
        words: [
          { text: "hello", startFrame: 0, endFrame: 15 },
          { text: "world", startFrame: 15, endFrame: 30 },
        ],
      },
    });
  });

  it("import_asset copies an image of the user into the project", async () => {
    const harness = await startHarness();
    const source = join(harness.folder, "..", "Logo.PNG");
    await writeFile(source, "not checked");

    const result = await harness.call({
      name: "import_asset",
      arguments: { asset_id: "logo", kind: "image", source_path: source },
    });

    expect(result.isError).toBe(false);
    expect(harness.store.read().assets[0]).toMatchObject({
      id: "logo",
      kind: "image",
      file: "assets/files/logo.png",
      source: { kind: "import", originalName: "Logo.PNG" },
    });
  });
});
