import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

export interface Finished {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export function runProgram(options: {
  command: string;
  args: string[];
  cwd: string;
  environment?: NodeJS.ProcessEnv;
}): Promise<Finished> {
  const child = spawn(options.command, options.args, {
    cwd: options.cwd,
    env: options.environment ?? process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout: string[] = [];
  const stderr: string[] = [];
  child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk.toString()));
  child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk.toString()));
  const finished = Promise.withResolvers<Finished>();
  child.on("error", finished.reject);
  child.on("close", (exitCode) => {
    finished.resolve({
      exitCode,
      stdout: stdout.join(""),
      stderr: stderr.join(""),
    });
  });
  return finished.promise;
}

export async function runOrStop(options: {
  command: string;
  args: string[];
  cwd: string;
}): Promise<string> {
  const finished = await runProgram(options);
  if (finished.exitCode !== 0) {
    throw new Error(
      `${options.command} ${options.args.join(" ")} exited with ${String(finished.exitCode)}:\n${finished.stdout}${finished.stderr}`,
    );
  }
  return finished.stdout;
}

export function startProgram(options: {
  command: string;
  args: string[];
  cwd: string;
}): ChildProcessWithoutNullStreams {
  return spawn(options.command, options.args, {
    cwd: options.cwd,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

export function stopProgram(
  child: ChildProcessWithoutNullStreams,
): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve();
      return;
    }
    child.on("close", () => {
      resolve();
    });
    child.kill("SIGINT");
  });
}
