import { spawn } from "node:child_process";
import { once } from "node:events";
import type { Writable } from "node:stream";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";

const stderrTailLines = 20;

export interface FrameEncoder {
  write: (png: Uint8Array) => Promise<void>;
  finish: () => Promise<Outcome<{ finished: true }, RenderFailure>>;
  stop: () => void;
}

function writeChunk(options: {
  stream: Writable;
  chunk: Uint8Array;
}): Promise<void> {
  const written = Promise.withResolvers<undefined>();
  options.stream.write(options.chunk, (error) => {
    if (error) {
      written.reject(error);
      return;
    }
    written.resolve(undefined);
  });
  return written.promise;
}

export function startEncoder(ffmpegArguments: string[]): FrameEncoder {
  const ffmpeg = spawn("ffmpeg", ffmpegArguments, {
    stdio: ["pipe", "ignore", "pipe"],
  });
  const closed = once(ffmpeg, "close");
  let stderr = "";
  ffmpeg.stderr.setEncoding("utf8");
  ffmpeg.stderr.on("data", (chunk: string) => {
    stderr = (stderr + chunk).slice(-16_000);
  });
  let writeError: unknown;
  ffmpeg.stdin.on("error", (error) => {
    writeError = error;
  });
  return {
    write: async (png) => {
      if (writeError === undefined) {
        await writeChunk({ stream: ffmpeg.stdin, chunk: png }).catch(
          (error: unknown) => {
            writeError = error;
          },
        );
      }
    },
    finish: async () => {
      ffmpeg.stdin.end();
      await closed;
      if (ffmpeg.exitCode === 0 && writeError === undefined) {
        return succeed({ finished: true });
      }
      const stderrTail = stderr
        .trimEnd()
        .split("\n")
        .slice(-stderrTailLines)
        .join("\n");
      return fail({
        kind: "encode-failed",
        stderrTail,
        message: `FFmpeg failed with exit code ${String(ffmpeg.exitCode)}: ${stderrTail.split("\n").at(-1) ?? ""}`,
      });
    },
    stop: () => {
      ffmpeg.kill("SIGKILL");
    },
  };
}
