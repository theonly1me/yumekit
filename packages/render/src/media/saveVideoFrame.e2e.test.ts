import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { saveVideoFrame } from "../index.js";
import { readGrayPicture } from "../motion/grayFrames.js";
import { temporaryFolder } from "../testing/renderProject.js";

const runFile = promisify(execFile);

async function blackThenWhite(folder: string): Promise<string> {
  const file = join(folder, "black-then-white.mp4");
  await runFile("ffmpeg", [
    ...["-v", "error", "-y", "-f", "lavfi", "-i", "color=black:s=64x36:d=1"],
    ...["-f", "lavfi", "-i", "color=white:s=64x36:d=1"],
    ...["-filter_complex", "[0][1]concat=n=2", "-r", "24"],
    ...["-pix_fmt", "yuv420p", file],
  ]);
  return file;
}

async function brightnessOf(file: string): Promise<number> {
  const picture = await readGrayPicture(file);
  if (!picture.ok) throw new Error(picture.failure.message);
  return (
    picture.value.reduce((...[sum, value]) => sum + value, 0) /
    picture.value.length
  );
}

describe("saveVideoFrame", () => {
  it("saves the picture at a time, and the last picture with no time", async () => {
    const folder = await temporaryFolder();
    const file = await blackThenWhite(folder);

    const early = await saveVideoFrame({
      file,
      seconds: 0.5,
      target: join(folder, "early.png"),
    });
    const last = await saveVideoFrame({
      file,
      target: join(folder, "last.png"),
    });

    expect(early.ok && last.ok).toBe(true);
    expect(await brightnessOf(join(folder, "early.png"))).toBeLessThan(30);
    expect(await brightnessOf(join(folder, "last.png"))).toBeGreaterThan(225);
  });

  it("takes the last picture when the time is past the picture but inside the sound", async () => {
    const folder = await temporaryFolder();
    const file = join(folder, "sound-runs-longer.mp4");
    await runFile("ffmpeg", [
      ...["-v", "error", "-y", "-f", "lavfi", "-i", "color=white:s=64x36:d=3"],
      ...["-f", "lavfi", "-i", "sine=frequency=440:duration=3.2"],
      ...["-r", "30", "-pix_fmt", "yuv420p", "-c:a", "aac", file],
    ]);

    const end = await saveVideoFrame({
      file,
      seconds: 3.15,
      target: join(folder, "end.png"),
    });

    expect(end.ok).toBe(true);
    expect(await brightnessOf(join(folder, "end.png"))).toBeGreaterThan(225);
  });
});
