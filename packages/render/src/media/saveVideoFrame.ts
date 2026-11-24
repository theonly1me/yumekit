import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import { findFfmpeg } from "../video/findFfmpeg.js";

const runFile = promisify(execFile);

const lastFrameMargin = 0.05;

function framePickArguments(options: {
  file: string;
  seconds?: number | undefined;
}): string[] {
  return options.seconds === undefined
    ? ["-sseof", String(-lastFrameMargin * 4), "-i", options.file]
    : [
        ...["-ss", String(Math.max(0, options.seconds - lastFrameMargin))],
        ...["-i", options.file, "-frames:v", "1"],
      ];
}

export async function saveVideoFrame(options: {
  file: string;
  seconds?: number;
  target: string;
}): Promise<Outcome<{ file: string }, RenderFailure>> {
  const missing = await findFfmpeg();
  if (missing !== undefined) return fail(missing);
  try {
    await mkdir(dirname(options.target), { recursive: true });
    await runFile("ffmpeg", [
      ...["-v", "error", "-y", ...framePickArguments(options)],
      ...["-an", "-update", "1", options.target],
    ]);
    return succeed({ file: options.target });
  } catch {
    return fail({
      kind: "media-not-readable",
      file: options.file,
      message: `FFmpeg cannot take a picture from "${options.file}".`,
      hint: "Check that the file is a complete video file and that the time is inside it.",
    });
  }
}
