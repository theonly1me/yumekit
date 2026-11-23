import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Outcome } from "../toolResults.ts";

const runFile = promisify(execFile);

export const ffmpegNeededMessage =
  "The sample sharpen_media needs FFmpeg, and ffmpeg or ffprobe is not on the PATH. Install FFmpeg (macOS: brew install ffmpeg. Debian or Ubuntu: sudo apt-get install ffmpeg), then start the server again.";

function lastLineOf(text: string): string {
  return (
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1) ?? "no error output"
  );
}

function failureOf(options: { program: string; error: unknown }): string {
  const { error } = options;
  if (!(error instanceof Error)) return `${options.program} failed`;
  if ("code" in error && error.code === "ENOENT") return ffmpegNeededMessage;
  const errorOutput =
    "stderr" in error && typeof error.stderr === "string" ? error.stderr : "";
  return `${options.program} failed: ${lastLineOf(errorOutput)}`;
}

export async function runProgram(options: {
  program: "ffmpeg" | "ffprobe";
  arguments: string[];
}): Promise<Outcome<string, string>> {
  try {
    const { stdout } = await runFile(options.program, options.arguments, {
      maxBuffer: 1024 * 1024,
    });
    return { ok: true, value: stdout };
  } catch (error) {
    return {
      ok: false,
      failure: failureOf({ program: options.program, error }),
    };
  }
}
