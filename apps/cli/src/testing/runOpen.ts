import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { onTestFinished } from "vitest";
import { builtMainFile } from "./runCli.js";

export interface OpenRun {
  url: string;
  origin: string;
  port: number;
  token: string;
  processId: number;
  output: () => string;
  stop: (signal?: NodeJS.Signals) => Promise<number | null>;
}

const startWaitMilliseconds = 60_000;

export function runOpen(options: {
  folder: string;
  environment: NodeJS.ProcessEnv;
}): Promise<OpenRun> {
  return runServing({
    args: ["open", options.folder, "--no-browser"],
    environment: options.environment,
  });
}

export async function runServing(options: {
  args: string[];
  environment: NodeJS.ProcessEnv;
}): Promise<OpenRun> {
  const child = spawn(process.execPath, [builtMainFile, ...options.args], {
    env: options.environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const chunks: string[] = [];
  child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk.toString()));
  child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk.toString()));
  const exited = new Promise<number | null>((resolve) => {
    child.on("exit", (code) => {
      resolve(code);
    });
  });
  onTestFinished(async () => {
    child.kill("SIGINT");
    await exited;
  });
  const deadline = Date.now() + startWaitMilliseconds;
  let match = /http:\/\/127\.0\.0\.1:(\d+)\/\?token=([0-9a-f]{64})/.exec(
    chunks.join(""),
  );
  while (match === null && Date.now() < deadline && child.exitCode === null) {
    await delay(50);
    match = /http:\/\/127\.0\.0\.1:(\d+)\/\?token=([0-9a-f]{64})/.exec(
      chunks.join(""),
    );
  }
  const [url = "", port = "", token = ""] = match ?? [];
  if (url === "" || child.pid === undefined) {
    throw new Error(
      `yumekit ${options.args.join(" ")} did not start: ${chunks.join("")}`,
    );
  }
  return {
    url,
    origin: new URL(url).origin,
    port: Number(port),
    token,
    processId: child.pid,
    output: () => chunks.join(""),
    stop: (signal = "SIGTERM") => {
      child.kill(signal);
      return exited;
    },
  };
}
