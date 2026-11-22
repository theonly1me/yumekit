import { spawn, type ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";
import type { BrainEvent, StreamParser, Turn, TurnEnd } from "../brainTypes.js";

export const stopWaitMilliseconds = 5_000;

export interface ProgramRun {
  programPath: string;
  arguments: string[];
  workingFolder: string;
  environment?: Record<string, string>;
  parser: StreamParser;
  onEvent: (event: BrainEvent) => void;
}

function hasExited(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null;
}

function stopChild(child: ChildProcess): void {
  if (hasExited(child)) return;
  child.kill("SIGINT");
  const killTimer = setTimeout(() => {
    if (!hasExited(child)) child.kill("SIGKILL");
  }, stopWaitMilliseconds);
  child.once("exit", () => {
    clearTimeout(killTimer);
  });
}

function notStarted(programPath: string): TurnEnd {
  return {
    kind: "failed",
    reason: "program",
    message: `The AI program ${programPath} did not start.`,
  };
}

export function runTurn(run: ProgramRun): Turn {
  const ended = Promise.withResolvers<TurnEnd>();
  const child = spawn(run.programPath, run.arguments, {
    cwd: run.workingFolder,
    env: { ...process.env, ...run.environment },
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });
  let stopRequested = false;
  let streamEnd: TurnEnd | undefined;
  let lastErrorLine: string | undefined;
  const errorLines = createInterface({ input: child.stderr });
  errorLines.on("line", (line) => {
    if (line.trim() !== "") lastErrorLine = line.trim();
  });
  const lines = createInterface({ input: child.stdout });
  lines.on("line", (line) => {
    const step = run.parser.readLine(line);
    for (const event of step.events) run.onEvent(event);
    if (step.end !== undefined) streamEnd ??= step.end;
    if (step.stopProgram === true) stopChild(child);
  });
  child.once("error", () => {
    lines.close();
    errorLines.close();
    ended.resolve(notStarted(run.programPath));
  });
  child.once("close", () => {
    lines.close();
    errorLines.close();
    ended.resolve(
      streamEnd ?? run.parser.endOf({ stopRequested, lastErrorLine }),
    );
  });
  return {
    ended: ended.promise,
    stop: () => {
      stopRequested = true;
      stopChild(child);
    },
  };
}
