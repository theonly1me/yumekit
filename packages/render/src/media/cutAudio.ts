import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import { findFfmpeg } from "../video/findFfmpeg.js";

const runFile = promisify(execFile);

const tailLength = 600;

export interface AudioCut {
  file: string;
  startSeconds: number;
  durationSeconds: number;
  leadSeconds: number;
  target: string;
}

function cutArguments(cut: AudioCut): string[] {
  const leadMilliseconds = Math.round(cut.leadSeconds * 1000);
  return [
    ...["-v", "error", "-y", "-ss", String(cut.startSeconds)],
    ...["-t", String(cut.durationSeconds), "-i", cut.file, "-vn"],
    ...(leadMilliseconds > 0
      ? ["-af", `adelay=${String(leadMilliseconds)}:all=1`]
      : []),
    ...["-c:a", "pcm_s16le", "-ar", "48000", cut.target],
  ];
}

function stderrOf(error: unknown): string {
  return error instanceof Error &&
    "stderr" in error &&
    typeof error.stderr === "string"
    ? error.stderr
    : String(error);
}

export async function cutAudio(
  cut: AudioCut,
): Promise<Outcome<{ file: string }, RenderFailure>> {
  const missing = await findFfmpeg();
  if (missing !== undefined) return fail(missing);
  try {
    await mkdir(dirname(cut.target), { recursive: true });
    await runFile("ffmpeg", cutArguments(cut));
    return succeed({ file: cut.target });
  } catch (error) {
    return fail({
      kind: "encode-failed",
      stderrTail: stderrOf(error).slice(-tailLength),
      message: `FFmpeg cannot cut the sound of "${cut.file}".`,
      hint: "Check that the file is a complete audio or video file with sound.",
    });
  }
}
