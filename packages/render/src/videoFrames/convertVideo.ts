import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

export const pictureFileOf = (pictureNumber: number): string =>
  `${String(pictureNumber).padStart(6, "0")}.jpg`;

export type Conversion =
  { ok: true; pictureCount: number } | { ok: false; stderrTail: string };

function lastLineOf(text: string): string {
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line !== "")
      .at(-1) ?? ""
  );
}

function runFfmpeg(ffmpegArguments: string[]): Promise<Conversion> {
  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", ffmpegArguments, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    ffmpeg.stderr.setEncoding("utf8");
    ffmpeg.stderr.on("data", (chunk: string) => {
      stderr = (stderr + chunk).slice(-16_000);
    });
    ffmpeg.on("error", (error) => {
      resolve({ ok: false, stderrTail: error.message });
    });
    ffmpeg.on("close", (exitCode) => {
      resolve(
        exitCode === 0
          ? { ok: true, pictureCount: 0 }
          : { ok: false, stderrTail: lastLineOf(stderr) },
      );
    });
  });
}

export async function convertVideo(options: {
  file: string;
  framesPerSecond: number;
  folder: string;
}): Promise<Conversion> {
  const converted = await runFfmpeg([
    ...["-v", "error", "-nostdin"],
    ...["-i", options.file],
    ...["-vf", `fps=${String(options.framesPerSecond)}`],
    ...["-q:v", "2"],
    join(options.folder, "%06d.jpg"),
  ]);
  if (!converted.ok) {
    return converted;
  }
  const pictureCount = (await readdir(options.folder)).filter((name) =>
    /^\d{6}\.jpg$/.test(name),
  ).length;
  return pictureCount > 0
    ? { ok: true, pictureCount }
    : { ok: false, stderrTail: "FFmpeg made no pictures from the file." };
}
