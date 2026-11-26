import { spawn } from "node:child_process";
import { once } from "node:events";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { PictureSize } from "../png.js";
import type { RenderFailure } from "../renderFailure.js";

export interface SmallerFilePass {
  source: string;
  destination: string;
  workFolder: string;
  videoKilobitsPerSecond: number;
  audioKilobitsPerSecond: number;
  pictureSize: PictureSize;
}

const stderrTailLength = 2000;

function scaleArguments(size: PictureSize): string[] {
  return [
    "-vf",
    `scale=${String(size.widthPixels)}:${String(size.heightPixels)}:flags=lanczos`,
  ];
}

function passArguments(options: {
  pass: SmallerFilePass;
  number: 1 | 2;
}): string[] {
  const { pass, number } = options;
  const video = [
    ["-c:v", "libx264", "-preset", "slow", "-pix_fmt", "yuv420p"],
    ["-b:v", `${String(Math.round(pass.videoKilobitsPerSecond))}k`],
    ["-pass", String(number), "-passlogfile", join(pass.workFolder, "pass")],
    scaleArguments(pass.pictureSize),
  ].flat();
  const start = ["-hide_banner", "-loglevel", "error", "-y", "-i", pass.source];
  if (number === 1) {
    return [...start, "-map", "0:v", ...video, "-an", "-f", "null", "-"];
  }
  return [
    ...start,
    ...["-map", "0:v", "-map", "0:a?"],
    ...video,
    ...["-c:a", "aac", "-b:a", `${String(pass.audioKilobitsPerSecond)}k`],
    ...["-movflags", "+faststart", pass.destination],
  ];
}

async function runFfmpeg(
  ffmpegArguments: string[],
): Promise<Outcome<{ finished: true }, RenderFailure>> {
  const ffmpeg = spawn("ffmpeg", ffmpegArguments, {
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  ffmpeg.stderr.setEncoding("utf8");
  ffmpeg.stderr.on("data", (chunk: string) => {
    stderr = (stderr + chunk).slice(-stderrTailLength);
  });
  await once(ffmpeg, "close");
  if (ffmpeg.exitCode === 0) return succeed({ finished: true });
  return fail({
    kind: "encode-failed",
    message: "FFmpeg could not make the smaller file.",
    stderrTail: stderr.trim(),
  });
}

export async function encodeSmallerFile(
  pass: SmallerFilePass,
): Promise<Outcome<{ bytes: number }, RenderFailure>> {
  for (const number of [1, 2] as const) {
    const ran = await runFfmpeg(passArguments({ pass, number }));
    if (!ran.ok) return ran;
  }
  const { size } = await stat(pass.destination);
  return succeed({ bytes: size });
}
