import { spawn } from "node:child_process";
import { dirname } from "node:path";
import type { Outcome } from "../engineTypes.js";

export interface RevealCommand {
  program: string;
  arguments: string[];
  isVerbatim: boolean;
  countsAnyExit: boolean;
}

export interface RevealFailure {
  kind: "reveal-failed";
  message: string;
}

const startWaitMilliseconds = 10_000;

export function revealCommandOf(options: {
  platform: NodeJS.Platform;
  file: string;
}): RevealCommand {
  const { platform, file } = options;
  if (platform === "darwin") {
    return {
      program: "open",
      arguments: ["-R", file],
      isVerbatim: false,
      countsAnyExit: false,
    };
  }
  if (platform === "win32") {
    return {
      program: "explorer.exe",
      arguments: [`/select,"${file}"`],
      isVerbatim: true,
      countsAnyExit: true,
    };
  }
  return {
    program: "xdg-open",
    arguments: [dirname(file)],
    isVerbatim: false,
    countsAnyExit: false,
  };
}

function failed(message: string): { ok: false; failure: RevealFailure } {
  return { ok: false, failure: { kind: "reveal-failed", message } };
}

export function revealFile(
  command: RevealCommand,
): Promise<Outcome<undefined, RevealFailure>> {
  const finished = Promise.withResolvers<Outcome<undefined, RevealFailure>>();
  const child = spawn(command.program, command.arguments, {
    stdio: "ignore",
    windowsVerbatimArguments: command.isVerbatim,
  });
  const timer = setTimeout(() => {
    child.unref();
    finished.resolve({ ok: true, value: undefined });
  }, startWaitMilliseconds);
  child.on("error", (error) => {
    clearTimeout(timer);
    finished.resolve(
      failed(
        `The computer could not start ${command.program}: ${error.message}`,
      ),
    );
  });
  child.on("exit", (code) => {
    clearTimeout(timer);
    finished.resolve(
      code === 0 || command.countsAnyExit
        ? { ok: true, value: undefined }
        : failed(
            `${command.program} could not show the file. It ended with code ${String(code)}.`,
          ),
    );
  });
  return finished.promise;
}
