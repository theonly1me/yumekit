import { spawn } from "node:child_process";
import type { Writable } from "node:stream";
import type { Outcome } from "../toolResults.ts";
import { videoFramesPerSecond } from "./videoShape.ts";

const toneHertz = 330;
const toneVolume = 0.1;
const audioSampleRate = 48000;

export const ffmpegMissingMessage =
  "The sample generate_video needs FFmpeg, and ffmpeg is not on the PATH. Install FFmpeg (macOS: brew install ffmpeg. Debian or Ubuntu: sudo apt-get install ffmpeg), then start the server again.";

export interface VideoEncoding {
  path: string;
  width: number;
  height: number;
  frameCount: number;
  withAudio: boolean;
  drawFrame: (frameIndex: number) => Uint8Array;
}

function ffmpegArgumentsOf(encoding: VideoEncoding): string[] {
  const size = `${String(encoding.width)}x${String(encoding.height)}`;
  const rate = String(videoFramesPerSecond);
  const seconds = String(encoding.frameCount / videoFramesPerSecond);
  const tone = `sine=frequency=${String(toneHertz)}:sample_rate=${String(audioSampleRate)}:duration=${seconds}`;
  return [
    ...["-v", "error", "-y"],
    ...["-f", "rawvideo", "-pix_fmt", "rgba", "-s", size, "-r", rate],
    ...["-i", "pipe:0"],
    ...(encoding.withAudio ? ["-f", "lavfi", "-i", tone] : []),
    ...["-map", "0:v"],
    ...(encoding.withAudio
      ? ["-map", "1:a", "-filter:a", `volume=${String(toneVolume)}`]
      : []),
    ...["-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p"],
    ...(encoding.withAudio ? ["-c:a", "aac"] : []),
    ...["-movflags", "+faststart", encoding.path],
  ];
}

function isMissingProgram(error: Error): boolean {
  return "code" in error && error.code === "ENOENT";
}

function lastLineOf(text: string): string {
  return (
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1) ?? "no error output"
  );
}

function readyForMore(stream: Writable): Promise<void> {
  return new Promise((resolve) => {
    const settle = () => {
      stream.off("drain", settle);
      stream.off("close", settle);
      resolve();
    };
    stream.on("drain", settle);
    stream.on("close", settle);
  });
}

export async function encodeVideo(
  encoding: VideoEncoding,
): Promise<Outcome<undefined, string>> {
  const child = spawn("ffmpeg", ffmpegArgumentsOf(encoding), {
    stdio: ["pipe", "ignore", "pipe"],
  });
  let errorOutput = "";
  child.stderr.on("data", (chunk) => {
    errorOutput += String(chunk);
  });
  const finished = new Promise<Outcome<undefined, string>>((resolve) => {
    child.on("error", (error) => {
      resolve({
        ok: false,
        failure: isMissingProgram(error)
          ? ffmpegMissingMessage
          : `FFmpeg did not start: ${error.message}`,
      });
    });
    child.on("close", (code) => {
      resolve(
        code === 0
          ? { ok: true, value: undefined }
          : {
              ok: false,
              failure: `FFmpeg failed: ${lastLineOf(errorOutput)}`,
            },
      );
    });
  });
  const { stdin } = child;
  stdin.on("error", () => {
    stdin.destroy();
  });
  for (
    let frameIndex = 0;
    frameIndex < encoding.frameCount && !stdin.destroyed;
    frameIndex += 1
  ) {
    if (!stdin.write(encoding.drawFrame(frameIndex))) {
      await readyForMore(stdin);
    }
  }
  stdin.end();
  return finished;
}
