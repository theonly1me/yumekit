import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AssetRegion } from "@yumekit/project";
import { z } from "zod";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import { splitPngs } from "./splitPngs.js";

const runFile = promisify(execFile);

const largestOutputBytes = 512 * 1024 * 1024;

const streamSchema = z.object({
  streams: z.array(
    z.object({
      r_frame_rate: z.string(),
      nb_frames: z.coerce.number().optional(),
    }),
  ),
  format: z.object({ duration: z.coerce.number().optional() }),
});

export interface VideoTiming {
  framesPerSecond: number;
  frameCount: number;
}

function rateOf(text: string): number {
  const [numerator, denominator] = text.split("/").map(Number);
  if (numerator === undefined || !Number.isFinite(numerator)) return 30;
  if (denominator === undefined || denominator === 0) return numerator;
  return numerator / denominator;
}

export async function videoTimingOf(
  file: string,
): Promise<VideoTiming | undefined> {
  try {
    const { stdout } = await runFile("ffprobe", [
      ...["-v", "error", "-select_streams", "v:0"],
      ...["-show_entries", "stream=r_frame_rate,nb_frames:format=duration"],
      ...["-of", "json", file],
    ]);
    const parsed = streamSchema.safeParse(JSON.parse(stdout));
    if (!parsed.success) return undefined;
    const [stream] = parsed.data.streams;
    if (stream === undefined) return undefined;
    const framesPerSecond = rateOf(stream.r_frame_rate);
    const frameCount =
      stream.nb_frames ??
      Math.floor((parsed.data.format.duration ?? 0) * framesPerSecond);
    return { framesPerSecond, frameCount };
  } catch {
    return undefined;
  }
}

function cropFilterOf(region: AssetRegion | undefined): string[] {
  if (region === undefined) return [];
  return [
    `crop=trunc(iw*${String(region.width)}/2)*2:trunc(ih*${String(region.height)}/2)*2:iw*${String(region.x)}:ih*${String(region.y)}`,
  ];
}

export async function extractPictures(options: {
  file: string;
  frameNumbers: number[] | undefined;
  region: AssetRegion | undefined;
  cellWidth: number;
}): Promise<Outcome<Uint8Array[], RenderFailure>> {
  const { frameNumbers } = options;
  const select =
    frameNumbers === undefined
      ? []
      : [
          `select='${frameNumbers.map((frame) => `eq(n\\,${String(frame)})`).join("+")}'`,
        ];
  const filters = [
    ...select,
    ...cropFilterOf(options.region),
    `scale=${String(options.cellWidth)}:-2:flags=lanczos`,
  ].join(",");
  try {
    const { stdout } = await runFile(
      "ffmpeg",
      [
        ...["-v", "error", "-i", options.file, "-vf", filters],
        ...(frameNumbers === undefined
          ? ["-frames:v", "1"]
          : ["-vsync", "vfr"]),
        ...["-f", "image2pipe", "-c:v", "png", "pipe:1"],
      ],
      { encoding: "buffer", maxBuffer: largestOutputBytes },
    );
    return succeed(splitPngs(stdout));
  } catch {
    return fail({
      kind: "media-not-readable",
      file: options.file,
      message: `FFmpeg cannot read the pictures of "${options.file}".`,
      hint: "Check that the file is a complete picture or video file.",
    });
  }
}
