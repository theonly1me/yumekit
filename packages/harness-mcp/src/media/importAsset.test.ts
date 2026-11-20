import { execFile } from "node:child_process";
import { copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";

const runFile = promisify(execFile);

async function generatedFile(options: {
  harness: Harness;
  assetId: string;
  capability: string;
  input: Record<string, unknown>;
  copyName: string;
}): Promise<string> {
  const { harness } = options;
  const made = await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: options.assetId,
      capability: options.capability,
      input: options.input,
    },
  });
  const copy = join(harness.folder, "..", options.copyName);
  await copyFile(join(harness.folder, String(made.data["file"])), copy);
  return copy;
}

function importFile(options: {
  harness: Harness;
  assetId: string;
  kind: string;
  sourcePath: string;
}) {
  return options.harness.call({
    name: "import_asset",
    arguments: {
      asset_id: options.assetId,
      kind: options.kind,
      source_path: options.sourcePath,
    },
  });
}

describe("import_asset", () => {
  it("copies an image of the user into the project with its size", async () => {
    const harness = await startHarness();
    const source = await generatedFile({
      harness,
      assetId: "made",
      capability: "image",
      input: { prompt: "a logo", width_pixels: 64, height_pixels: 48 },
      copyName: "Logo.PNG",
    });

    const result = await importFile({
      harness,
      assetId: "logo",
      kind: "image",
      sourcePath: source,
    });

    expect(result.isError).toBe(false);
    expect(harness.store.read().assets[1]).toMatchObject({
      id: "logo",
      kind: "image",
      file: "assets/files/logo.png",
      widthPixels: 64,
      heightPixels: 48,
      source: { kind: "import", originalName: "Logo.PNG" },
    });
  });

  it("imports a WAV file with its length in frames", async () => {
    const harness = await startHarness();
    const source = await generatedFile({
      harness,
      assetId: "made",
      capability: "speech",
      input: { text: "one two three four" },
      copyName: "take.wav",
    });

    const result = await importFile({
      harness,
      assetId: "take",
      kind: "audio",
      sourcePath: source,
    });

    expect(result.data).toMatchObject({
      asset_id: "take",
      kind: "audio",
      duration_frames: 36,
    });
    expect(harness.store.read().assets[1]).toMatchObject({
      kind: "audio",
      durationFrames: 36,
      hasWords: false,
    });
  });

  it("imports a video file with its length and size", async () => {
    const harness = await startHarness();
    const source = join(harness.folder, "..", "clip.mp4");
    await runFile("ffmpeg", [
      ...["-v", "error", "-y", "-f", "lavfi"],
      ...["-i", "color=c=blue:s=64x48:r=30:d=2"],
      ...["-c:v", "libx264", "-pix_fmt", "yuv420p", source],
    ]);

    const result = await importFile({
      harness,
      assetId: "clip",
      kind: "video",
      sourcePath: source,
    });

    expect(result.data).toMatchObject({ kind: "video", duration_frames: 60 });
    expect(harness.store.read().assets[0]).toMatchObject({
      file: "assets/files/clip.mp4",
      widthPixels: 64,
      heightPixels: 48,
      durationFrames: 60,
    });
  });

  it("imports a font file without reading it as media", async () => {
    const harness = await startHarness();
    const source = join(harness.folder, "..", "Brand.woff2");
    await writeFile(source, "font bytes");

    const result = await importFile({
      harness,
      assetId: "brand",
      kind: "font",
      sourcePath: source,
    });

    expect(result.isError).toBe(false);
    expect(harness.store.read().assets[0]).toMatchObject({ kind: "font" });
  });

  it("names the real kind of a file that does not match the kind of the call", async () => {
    const harness = await startHarness();
    const source = await generatedFile({
      harness,
      assetId: "made",
      capability: "image",
      input: { prompt: "a still", width_pixels: 64, height_pixels: 48 },
      copyName: "still.mp4",
    });

    const result = await importFile({
      harness,
      assetId: "still",
      kind: "video",
      sourcePath: source,
    });

    expect(result.data).toMatchObject({ kind: "file-type-not-supported" });
    expect(result.data["hint"]).toContain('kind "image"');
  });
});
