import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { temporaryFolder } from "../testing/connectFalMedia.ts";
import { readMp4Facts } from "./mp4Facts.ts";

const runFile = promisify(execFile);

describe("readMp4Facts", () => {
  it("reads the size and the length of an MP4 that FFmpeg makes", async () => {
    const path = join(await temporaryFolder(), "clip.mp4");
    await runFile("ffmpeg", [
      "-f",
      "lavfi",
      "-i",
      "color=c=red:s=320x176:d=2:r=24",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:duration=2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-shortest",
      "-y",
      path,
    ]);

    const facts = readMp4Facts(await readFile(path));

    expect(facts.widthPixels).toBe(320);
    expect(facts.heightPixels).toBe(176);
    expect(facts.durationSeconds).toBeCloseTo(2, 1);
  });

  it("returns no facts for bytes that are not an MP4", () => {
    expect(readMp4Facts(Buffer.from("not a video at all"))).toEqual({});
  });
});
