import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { probeMedia } from "./index.js";
import { temporaryFolder } from "./testing/renderProject.js";
import { toneWav } from "./testing/toneWav.js";

const runFile = promisify(execFile);

async function makeWithFfmpeg(options: {
  name: string;
  arguments: string[];
}): Promise<string> {
  const file = join(await temporaryFolder(), options.name);
  await runFile("ffmpeg", ["-v", "error", "-y", ...options.arguments, file]);
  return file;
}

describe("probeMedia", () => {
  it("reads the size of an image", async () => {
    const file = await makeWithFfmpeg({
      name: "picture.png",
      arguments: ["-f", "lavfi", "-i", "color=c=red:s=64x48", "-frames:v", "1"],
    });

    expect(await probeMedia({ file })).toEqual({
      ok: true,
      value: { kind: "image", widthPixels: 64, heightPixels: 48 },
    });
  });

  it("reads the length of an audio file", async () => {
    const file = join(await temporaryFolder(), "tone.wav");
    await writeFile(file, toneWav({ seconds: 1.5, frequencyHertz: 440 }));

    expect(await probeMedia({ file })).toEqual({
      ok: true,
      value: { kind: "audio", durationSeconds: 1.5 },
    });
  });

  it("reads the length and the size of a video file", async () => {
    const file = await makeWithFfmpeg({
      name: "clip.mp4",
      arguments: [
        ["-f", "lavfi", "-i", "color=c=blue:s=64x48:r=30:d=2"],
        ["-c:v", "libx264", "-pix_fmt", "yuv420p"],
      ].flat(),
    });

    const probed = await probeMedia({ file });

    expect(probed).toMatchObject({
      ok: true,
      value: {
        kind: "video",
        widthPixels: 64,
        heightPixels: 48,
        hasAudio: false,
      },
    });
    expect(probed.ok && probed.value.durationSeconds).toBeCloseTo(2, 1);
  });

  it("reads that a video file has sound", async () => {
    const file = await makeWithFfmpeg({
      name: "talk.mp4",
      arguments: [
        ["-f", "lavfi", "-i", "color=c=blue:s=64x48:r=24:d=1"],
        ["-f", "lavfi", "-i", "sine=frequency=440:duration=1"],
        ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac"],
      ].flat(),
    });

    expect(await probeMedia({ file })).toMatchObject({
      ok: true,
      value: { kind: "video", hasAudio: true },
    });
  });

  it("returns media-not-readable for a file that is not media", async () => {
    const file = join(await temporaryFolder(), "notes.wav");
    await writeFile(file, "plain text, not audio");

    expect(await probeMedia({ file })).toMatchObject({
      ok: false,
      failure: { kind: "media-not-readable", file },
    });
  });

  it("returns media-not-readable for a file that does not exist", async () => {
    const file = join(await temporaryFolder(), "missing.png");

    expect(await probeMedia({ file })).toMatchObject({
      ok: false,
      failure: { kind: "media-not-readable", file },
    });
  });
});
