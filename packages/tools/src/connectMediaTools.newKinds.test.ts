import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { describe, expect, it } from "vitest";
import { connectFixture } from "./testing/mediaToolsFixture.js";

function wavDurationSeconds(bytes: Buffer): number {
  return bytes.readUInt32LE(40) / bytes.readUInt32LE(28);
}

describe("the new kinds through the sample server", () => {
  it("makes a sound effect of the requested length with generate_sound_effect", async () => {
    const { tools, outputDirectory } = await connectFixture({});

    const outcome = await tools.run({
      capability: "sound-effect",
      input: { prompt: "a door slams", duration_seconds: 1.5 },
      outputDirectory,
      fileStem: "door",
    });

    if (!outcome.ok) throw new Error(outcome.failure.kind);
    const [file] = outcome.value.result.files;
    expect(outcome.value).toMatchObject({
      server: "sample",
      model: "sample-sound-effect",
    });
    expect(file?.kind).toBe("audio");
    expect(basename(file?.path ?? "")).toBe("door.wav");
    expect(wavDurationSeconds(await readFile(file?.path ?? ""))).toBeCloseTo(
      1.5,
      6,
    );
  });

  it("makes a larger copy of a picture with sharpen_media", async () => {
    const { tools, outputDirectory } = await connectFixture({});
    const picture = await tools.run({
      capability: "image",
      input: { prompt: "a fox", width_pixels: 200, height_pixels: 100 },
      outputDirectory,
      fileStem: "fox",
    });
    if (!picture.ok) throw new Error(picture.failure.kind);
    const [source] = picture.value.result.files;

    const outcome = await tools.run({
      capability: "sharper",
      input: { media_path: source?.path ?? "", scale: 2 },
      outputDirectory,
      fileStem: "fox-sharper",
    });

    if (!outcome.ok) throw new Error(outcome.failure.kind);
    expect(outcome.value.result.files).toMatchObject([
      { kind: "image", width_pixels: 400, height_pixels: 200 },
    ]);
  });
});
