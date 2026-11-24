import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { codexImageArgumentsOf } from "./codexArguments.ts";
import {
  emptyTurnFacts,
  noteEventLine,
  usageLimitMessageOf,
} from "./codexEvents.ts";

const stopWaitMilliseconds = 5_000;
const keptErrorCharacters = 4_000;

export type TurnEnd = { threadId: string | undefined } & (
  | { kind: "finished"; answer: string }
  | { kind: "failed"; message: string }
  | { kind: "usage-limit"; message: string }
  | { kind: "timed-out" }
);

export function runImageTurn(options: {
  programPath: string;
  prompt: string;
  workingFolder: string;
  referenceImagePaths: readonly string[];
  environment: NodeJS.ProcessEnv;
  limitSeconds: number;
}): Promise<TurnEnd> {
  const finished = Promise.withResolvers<TurnEnd>();
  const facts = emptyTurnFacts();
  let errorText = "";
  let timedOut = false;
  const child = spawn(
    options.programPath,
    codexImageArgumentsOf({
      prompt: options.prompt,
      workingFolder: options.workingFolder,
      referenceImagePaths: options.referenceImagePaths,
    }),
    {
      cwd: options.workingFolder,
      env: options.environment,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    },
  );
  const lines = createInterface({ input: child.stdout });
  lines.on("line", (line) => {
    noteEventLine({ facts, line });
  });
  child.stderr.on("data", (chunk: Buffer) => {
    errorText = `${errorText}${chunk.toString("utf8")}`.slice(
      -keptErrorCharacters,
    );
  });
  const limitTimer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGINT");
    setTimeout(() => child.kill("SIGKILL"), stopWaitMilliseconds).unref();
  }, options.limitSeconds * 1000);
  child.on("error", (error) => {
    clearTimeout(limitTimer);
    finished.resolve({
      kind: "failed",
      threadId: facts.threadId,
      message: `Codex did not start: ${error.message}`,
    });
  });
  child.on("close", (exitCode) => {
    clearTimeout(limitTimer);
    const { threadId } = facts;
    if (timedOut) {
      finished.resolve({ kind: "timed-out", threadId });
      return;
    }
    const usageLimit = usageLimitMessageOf({ facts, errorText });
    if (usageLimit !== undefined) {
      finished.resolve({ kind: "usage-limit", threadId, message: usageLimit });
      return;
    }
    if (exitCode !== 0 || facts.failure !== undefined) {
      const lastErrorLine = errorText.trim().split("\n").at(-1) ?? "";
      finished.resolve({
        kind: "failed",
        threadId,
        message:
          facts.failure ??
          (lastErrorLine || "Codex stopped before it made a picture."),
      });
      return;
    }
    finished.resolve({
      kind: "finished",
      threadId,
      answer: facts.answers.join("\n"),
    });
  });
  return finished.promise;
}
