import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const runFile = promisify(execFile);

const probeSchema = z.object({
  streams: z.array(
    z.object({
      codec_type: z.string(),
      codec_name: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
      pix_fmt: z.string().optional(),
      r_frame_rate: z.string(),
      nb_read_frames: z.string().optional(),
      sample_rate: z.string().optional(),
      channels: z.number().optional(),
    }),
  ),
});

export async function probeVideo(file: string) {
  const { stdout } = await runFile("ffprobe", [
    "-v",
    "error",
    "-count_frames",
    "-show_entries",
    "stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_read_frames,sample_rate,channels",
    "-of",
    "json",
    file,
  ]);
  return probeSchema.parse(JSON.parse(stdout)).streams;
}

const durationsSchema = z.object({
  streams: z.array(
    z.object({ codec_type: z.string(), duration: z.coerce.number() }),
  ),
});

export async function streamSeconds(
  file: string,
): Promise<{ video: number | undefined; audio: number | undefined }> {
  const { stdout } = await runFile("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "stream=codec_type,duration",
    "-of",
    "json",
    file,
  ]);
  const { streams } = durationsSchema.parse(JSON.parse(stdout));
  const secondsOf = (codecType: string) =>
    streams.find((stream) => stream.codec_type === codecType)?.duration;
  return { video: secondsOf("video"), audio: secondsOf("audio") };
}

export async function decodeAudio(file: string): Promise<Int16Array> {
  const { stdout } = await runFile(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      file,
      "-map",
      "0:a",
      "-ac",
      "1",
      "-ar",
      "48000",
      "-f",
      "s16le",
      "pipe:1",
    ],
    { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 },
  );
  return new Int16Array(
    stdout.buffer,
    stdout.byteOffset,
    stdout.byteLength / 2,
  );
}

export function loudness(options: {
  samples: Int16Array;
  fromSeconds: number;
  toSeconds: number;
}): number {
  const window = options.samples.subarray(
    Math.round(options.fromSeconds * 48_000),
    Math.round(options.toSeconds * 48_000),
  );
  let sumOfSquares = 0;
  for (const sample of window) {
    sumOfSquares += sample * sample;
  }
  return Math.sqrt(sumOfSquares / Math.max(1, window.length));
}
