import { execFile } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import { findFfmpeg } from "../video/findFfmpeg.js";

const runFile = promisify(execFile);

const lastFrameMargin = 0.05;

const fromEndSeconds = [lastFrameMargin * 4, 3] as const;

function framePickArguments(options: {
  file: string;
  seconds?: number | undefined;
  fromEnd?: number | undefined;
}): string[] {
  if (options.seconds !== undefined) {
    return [
      ...["-ss", String(Math.max(0, options.seconds - lastFrameMargin))],
      ...["-i", options.file, "-frames:v", "1"],
    ];
  }
  return options.fromEnd === undefined
    ? ["-i", options.file]
    : ["-sseof", String(-options.fromEnd), "-i", options.file];
}

async function pickFrame(options: {
  file: string;
  seconds?: number | undefined;
  fromEnd?: number | undefined;
  target: string;
}): Promise<boolean> {
  await runFile("ffmpeg", [
    ...["-v", "error", "-y", ...framePickArguments(options)],
    ...["-an", "-update", "1", options.target],
  ]);
  return stat(options.target).then(
    (found) => found.size > 0,
    () => false,
  );
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
    const tries = [
      ...(options.seconds === undefined ? [] : [{ seconds: options.seconds }]),
      ...fromEndSeconds.map((fromEnd) => ({ fromEnd })),
      {},
    ];
    let saved = false;
    for (const pick of tries) {
      if (saved) break;
      saved = await pickFrame({
        file: options.file,
        target: options.target,
        ...pick,
      });
    }
    if (!saved) throw new Error("FFmpeg wrote no picture.");
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
