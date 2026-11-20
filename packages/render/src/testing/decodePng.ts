import { spawn } from "node:child_process";
import { once } from "node:events";
import { pngSizeOf } from "../png.js";

export interface DecodedPicture {
  widthPixels: number;
  heightPixels: number;
  pixelAt: (point: { x: number; y: number }) => [number, number, number];
}

export async function decodePng(png: Uint8Array): Promise<DecodedPicture> {
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
  ffmpeg.stdin.end(png);
  await once(ffmpeg, "close");
  const pixels = Buffer.concat(chunks);
  const { widthPixels, heightPixels } = pngSizeOf(png);
  return {
    widthPixels,
    heightPixels,
    pixelAt: ({ x, y }) => {
      const offset = (y * widthPixels + x) * 3;
      return [
        pixels[offset] ?? -1,
        pixels[offset + 1] ?? -1,
        pixels[offset + 2] ?? -1,
      ];
    },
  };
}
