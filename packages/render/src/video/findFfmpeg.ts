import { spawn } from "node:child_process";
import type { RenderFailure } from "../renderFailure.js";

const installHint =
  "Install FFmpeg and put it on the PATH. macOS: brew install ffmpeg. Debian or Ubuntu: sudo apt-get install ffmpeg. Windows: winget install ffmpeg.";

function isOnPath(program: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(program, ["-version"], { stdio: "ignore" });
    child.on("error", () => {
      resolve(false);
    });
    child.on("close", () => {
      resolve(true);
    });
  });
}

export async function findFfmpeg(): Promise<RenderFailure | undefined> {
  for (const program of ["ffmpeg", "ffprobe"]) {
    if (!(await isOnPath(program))) {
      return {
        kind: "ffmpeg-not-found",
        message: `${program} is not on the PATH.`,
        hint: installHint,
      };
    }
  }
  return undefined;
}
