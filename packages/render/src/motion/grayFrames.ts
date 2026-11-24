import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";

const runFile = promisify(execFile);

export const measureSize = { width: 160, height: 90 } as const;

export const measureFramesPerSecond = 8;

const largestOutputBytes = 256 * 1024 * 1024;

const pixelsInFrame = measureSize.width * measureSize.height;

function scaleFilter(): string {
  return `scale=${String(measureSize.width)}:${String(measureSize.height)}:flags=area,format=gray`;
}

function softened(frame: Uint8Array): Uint8Array {
  const { width, height } = measureSize;
  const result = new Uint8Array(frame.length);
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      let sum = 0;
      let count = 0;
      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
          const sampleRow = row + rowOffset;
          const sampleColumn = column + columnOffset;
          if (sampleRow < 0 || sampleRow >= height) continue;
          if (sampleColumn < 0 || sampleColumn >= width) continue;
          sum += frame[sampleRow * width + sampleColumn] ?? 0;
          count += 1;
        }
      }
      result[row * width + column] = Math.round(sum / count);
    }
  }
  return result;
}

function framesOf(bytes: Buffer): Uint8Array[] {
  const count = Math.floor(bytes.length / pixelsInFrame);
  return Array.from({ length: count }, (...[, index]) =>
    softened(
      new Uint8Array(
        bytes.subarray(index * pixelsInFrame, (index + 1) * pixelsInFrame),
      ),
    ),
  );
}

function unreadable(file: string): Outcome<Uint8Array[], RenderFailure> {
  return fail({
    kind: "media-not-readable",
    file,
    message: `FFmpeg cannot read the pictures of "${file}".`,
    hint: "Check that the file is a complete picture or video file.",
  });
}

export async function readGrayFrames(
  file: string,
): Promise<Outcome<Uint8Array[], RenderFailure>> {
  try {
    const { stdout } = await runFile(
      "ffmpeg",
      [
        ...["-v", "error", "-i", file, "-an"],
        ...["-vf", `fps=${String(measureFramesPerSecond)},${scaleFilter()}`],
        ...["-f", "rawvideo", "pipe:1"],
      ],
      { encoding: "buffer", maxBuffer: largestOutputBytes },
    );
    const frames = framesOf(stdout);
    return frames.length === 0 ? unreadable(file) : succeed(frames);
  } catch {
    return unreadable(file);
  }
}

export async function readGrayPicture(
  file: string,
): Promise<Outcome<Uint8Array, RenderFailure>> {
  try {
    const { stdout } = await runFile(
      "ffmpeg",
      [
        ...["-v", "error", "-i", file, "-frames:v", "1"],
        ...["-vf", scaleFilter(), "-f", "rawvideo", "pipe:1"],
      ],
      { encoding: "buffer", maxBuffer: largestOutputBytes },
    );
    const [picture] = framesOf(stdout);
    if (picture !== undefined) return succeed(picture);
  } catch {
    return fail({
      kind: "media-not-readable",
      file,
      message: `FFmpeg cannot read the picture "${file}".`,
      hint: "Check that the file is a complete picture file.",
    });
  }
  return fail({
    kind: "media-not-readable",
    file,
    message: `FFmpeg found no picture in "${file}".`,
    hint: "Check that the file is a complete picture file.",
  });
}
