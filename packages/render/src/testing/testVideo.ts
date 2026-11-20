import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import type { Edit } from "@yumekit/project";

const runFile = promisify(execFile);

export const markerStepPixels = 6;
export const markerWidthPixels = 4;

export interface TestVideo {
  framesPerSecond: number;
  seconds: number;
  widthPixels: number;
  heightPixels: number;
  withAudio: boolean;
  markerX?: string;
}

export const movingMarkerVideo: TestVideo = {
  framesPerSecond: 24,
  seconds: 2,
  widthPixels: 320,
  heightPixels: 180,
  withAudio: false,
};

function ffmpegArgumentsOf(options: { video: TestVideo; file: string }) {
  const { video } = options;
  const size = `${String(video.widthPixels)}x${String(video.heightPixels)}`;
  const timing = `r=${String(video.framesPerSecond)}:d=${String(video.seconds)}`;
  const markerX =
    video.markerX ??
    `round(t*${String(video.framesPerSecond)})*${String(markerStepPixels)}`;
  return [
    ...["-v", "error", "-y"],
    ...["-f", "lavfi", "-i", `color=c=black:s=${size}:${timing}`],
    ...[
      "-f",
      "lavfi",
      "-i",
      `color=c=red:s=${String(markerWidthPixels)}x${String(video.heightPixels)}:${timing}`,
    ],
    ...(video.withAudio
      ? [
          "-f",
          "lavfi",
          "-i",
          `sine=frequency=440:duration=${String(video.seconds)}`,
        ]
      : []),
    ...[
      "-filter_complex",
      `[0:v][1:v]overlay=x=${markerX}:y=0:shortest=1[picture]`,
    ],
    ...["-map", "[picture]", ...(video.withAudio ? ["-map", "2:a"] : [])],
    ...["-c:v", "libx264", "-pix_fmt", "yuv420p"],
    ...(video.withAudio ? ["-c:a", "aac"] : []),
    options.file,
  ];
}

export async function addVideoAsset(options: {
  folder: string;
  assetId: string;
  video: TestVideo;
  projectFramesPerSecond?: number;
}): Promise<Edit> {
  const file = `assets/files/${options.assetId}.mp4`;
  const path = join(options.folder, file);
  await mkdir(dirname(path), { recursive: true });
  await runFile(
    "ffmpeg",
    ffmpegArgumentsOf({ video: options.video, file: path }),
  );
  return {
    kind: "addAsset",
    asset: {
      id: options.assetId,
      kind: "video",
      file,
      widthPixels: options.video.widthPixels,
      heightPixels: options.video.heightPixels,
      durationFrames: Math.round(
        options.video.seconds * (options.projectFramesPerSecond ?? 30),
      ),
      hasAudio: options.video.withAudio,
      source: { kind: "import", originalName: `${options.assetId}.mp4` },
    },
  };
}

export async function addDamagedVideoAsset(options: {
  folder: string;
  assetId: string;
}): Promise<Edit> {
  const file = `assets/files/${options.assetId}.mp4`;
  const path = join(options.folder, file);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, "these bytes are not a video file");
  return {
    kind: "addAsset",
    asset: {
      id: options.assetId,
      kind: "video",
      file,
      durationFrames: 30,
      hasAudio: false,
      source: { kind: "import", originalName: `${options.assetId}.mp4` },
    },
  };
}

export function markerCenterOf(pixelRow: [number, number, number][]): number {
  const redColumns = [...pixelRow.entries()]
    .filter(([, [red, green, blue]]) => red > 150 && green < 100 && blue < 100)
    .map(([column]) => column);
  if (redColumns.length === 0) {
    return -1;
  }
  let columnSum = 0;
  for (const column of redColumns) {
    columnSum += column;
  }
  return columnSum / redColumns.length;
}
