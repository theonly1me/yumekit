import { readFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { connectFixture } from "./testing/mediaToolsFixture.js";

const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

function wavDurationSeconds(bytes: Buffer): number {
  return bytes.readUInt32LE(40) / bytes.readUInt32LE(28);
}

function roundedTimings(
  words: { text: string; start_seconds: number; end_seconds: number }[] = [],
): [string, number, number][] {
  return words.map((word) => [
    word.text,
    Number(word.start_seconds.toFixed(6)),
    Number(word.end_seconds.toFixed(6)),
  ]);
}

function onlyFile<Value>(files: Value[]): Value {
  const [file, ...others] = files;
  if (!file || others.length > 0) throw new Error("Expected one file");
  return file;
}

describe("connectMediaTools with the sample server", () => {
  it("lists the sample server with each capability, sound effects and sharper copies included, when no file exists", async () => {
    const { tools } = await connectFixture({});

    expect(tools.list()).toMatchObject([
      {
        server: "sample",
        capabilities: [
          "image",
          "speech",
          "align",
          "music",
          "video",
          "sound-effect",
          "sharper",
        ],
      },
    ]);
  });

  it("makes a PNG of the requested size inside the output directory", async () => {
    const { tools, outputDirectory } = await connectFixture({});

    const outcome = await tools.run({
      capability: "image",
      input: { prompt: "a red fox", width_pixels: 320, height_pixels: 180 },
      outputDirectory,
      fileStem: "fox",
    });

    if (!outcome.ok) throw new Error(outcome.failure.kind);
    const file = onlyFile(outcome.value.result.files);
    expect(file).toMatchObject({
      kind: "image",
      width_pixels: 320,
      height_pixels: 180,
    });
    expect(dirname(file.path)).toBe(outputDirectory);
    expect(basename(file.path)).toBe("fox.png");
    const bytes = await readFile(file.path);
    expect([...bytes.subarray(0, 8)]).toEqual(pngSignature);
    expect(bytes.readUInt32BE(16)).toBe(320);
    expect(bytes.readUInt32BE(20)).toBe(180);
    const imageData = bytes.subarray(41, 33 + 8 + bytes.readUInt32BE(33));
    expect(inflateSync(imageData).length).toBe((320 * 4 + 1) * 180);
  });

  it("gives the same image bytes for the same prompt and other bytes for another prompt", async () => {
    const { tools, outputDirectory } = await connectFixture({});
    const makeImage = async (options: { prompt: string; fileStem: string }) => {
      const outcome = await tools.run({
        capability: "image",
        input: { prompt: options.prompt, width_pixels: 64, height_pixels: 64 },
        outputDirectory,
        fileStem: options.fileStem,
      });
      if (!outcome.ok) throw new Error(outcome.failure.kind);
      return readFile(onlyFile(outcome.value.result.files).path);
    };

    const first = await makeImage({ prompt: "a red fox", fileStem: "first" });
    const second = await makeImage({ prompt: "a red fox", fileStem: "second" });
    const other = await makeImage({
      prompt: "a blue whale",
      fileStem: "other",
    });

    expect(second.equals(first)).toBe(true);
    expect(other.equals(first)).toBe(false);
  });

  it("makes speech of 0.3 seconds for each word with even word timings", async () => {
    const { tools, outputDirectory } = await connectFixture({});

    const outcome = await tools.run({
      capability: "speech",
      input: { text: "one two three four" },
      outputDirectory,
      fileStem: "line",
    });

    if (!outcome.ok) throw new Error(outcome.failure.kind);
    const file = onlyFile(outcome.value.result.files);
    expect(file.kind).toBe("audio");
    expect(file.duration_seconds).toBeCloseTo(1.2, 6);
    expect(wavDurationSeconds(await readFile(file.path))).toBeCloseTo(1.2, 6);
    expect(roundedTimings(outcome.value.result.words)).toEqual([
      ["one", 0, 0.3],
      ["two", 0.3, 0.6],
      ["three", 0.6, 0.9],
      ["four", 0.9, 1.2],
    ]);
  });

  it("aligns words evenly over the length of an audio file and writes no file", async () => {
    const { tools, outputDirectory } = await connectFixture({});
    const speech = await tools.run({
      capability: "speech",
      input: { text: "one two three four" },
      outputDirectory,
      fileStem: "line",
    });
    if (!speech.ok) throw new Error(speech.failure.kind);

    const outcome = await tools.run({
      capability: "align",
      input: {
        audio_path: onlyFile(speech.value.result.files).path,
        text: "hello world",
      },
      outputDirectory,
      fileStem: "unused",
    });

    if (!outcome.ok) throw new Error(outcome.failure.kind);
    expect(outcome.value.result.files).toEqual([]);
    expect(roundedTimings(outcome.value.result.words)).toEqual([
      ["hello", 0, 0.6],
      ["world", 0.6, 1.2],
    ]);
  });

  it("makes music of the requested length", async () => {
    const { tools, outputDirectory } = await connectFixture({});

    const outcome = await tools.run({
      capability: "music",
      input: { prompt: "calm piano", duration_seconds: 2.5 },
      outputDirectory,
      fileStem: "theme",
    });

    if (!outcome.ok) throw new Error(outcome.failure.kind);
    const file = onlyFile(outcome.value.result.files);
    expect(basename(file.path)).toBe("theme.wav");
    expect(wavDurationSeconds(await readFile(file.path))).toBeCloseTo(2.5, 6);
  });
});
