import { spawn } from "node:child_process";
import { once } from "node:events";
import type { ToolCall } from "./harnessFixture.js";
import { pngSizeOf } from "./probeVideo.js";

export interface Picture {
  width: number;
  height: number;
  pixels: Buffer;
}

export async function decodePicture(base64: string): Promise<Picture> {
  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      "pipe:0",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "pipe:1",
    ],
    { stdio: ["pipe", "pipe", "inherit"] },
  );
  const chunks: Buffer[] = [];
  ffmpeg.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
  ffmpeg.stdin.end(Buffer.from(base64, "base64"));
  await once(ffmpeg, "close");
  return { ...pngSizeOf(base64), pixels: Buffer.concat(chunks) };
}

export async function picturesOf(call: ToolCall): Promise<Picture[]> {
  const images = call.result.content.flatMap((content) =>
    content.type === "image" ? [content.data] : [],
  );
  return Promise.all(images.map(decodePicture));
}

export function colorCountOf(picture: Picture): number {
  const colors = new Set<number>();
  for (let offset = 0; offset < picture.pixels.length; offset += 3) {
    colors.add(picture.pixels.readUIntBE(offset, 3));
  }
  return colors.size;
}

export interface ChangedPoint {
  x: number;
  y: number;
}

export function changedPointsOf(options: {
  picture: Picture;
  other: Picture;
  threshold: number;
}): ChangedPoint[] {
  const { picture, other, threshold } = options;
  const points: ChangedPoint[] = [];
  for (let index = 0; index < picture.width * picture.height; index += 1) {
    const offset = index * 3;
    const difference = Math.max(
      ...[0, 1, 2].map((channel) =>
        Math.abs(
          (picture.pixels[offset + channel] ?? 0) -
            (other.pixels[offset + channel] ?? 0),
        ),
      ),
    );
    if (difference > threshold) {
      points.push({
        x: index % picture.width,
        y: Math.floor(index / picture.width),
      });
    }
  }
  return points;
}
