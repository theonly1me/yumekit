import { spawn } from "node:child_process";

export interface ProgramCall {
  command: string;
  args: string[];
  input?: string;
  environment?: Record<string, string>;
}

export type ProgramResult =
  | { kind: "finished"; exitCode: number; output: string; errorOutput: string }
  | { kind: "not-found"; message: string };

export type RunProgram = (call: ProgramCall) => Promise<ProgramResult>;

export const runProgram: RunProgram = (call) =>
  new Promise((resolve) => {
    const child = spawn(call.command, call.args, {
      env: { ...process.env, ...call.environment },
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    const output: Buffer[] = [];
    const errorOutput: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => output.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => errorOutput.push(chunk));
    child.on("error", (error) => {
      resolve({ kind: "not-found", message: error.message });
    });
    child.on("close", (exitCode) => {
      resolve({
        kind: "finished",
        exitCode: exitCode ?? 1,
        output: Buffer.concat(output).toString("utf8"),
        errorOutput: Buffer.concat(errorOutput).toString("utf8"),
      });
    });
    child.stdin.on("error", () => undefined);
    child.stdin.end(call.input ?? "");
  });

export function failureTextOf(options: {
  program: string;
  result: ProgramResult;
}): string | undefined {
  const { program, result } = options;
  if (result.kind === "not-found") {
    return `${program} did not start: ${result.message}`;
  }
  if (result.exitCode === 0) return undefined;
  const reason = result.errorOutput.trim() || result.output.trim();
  return `${program} stopped with code ${String(result.exitCode)}${reason ? `: ${reason}` : ""}`;
}
