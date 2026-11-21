import { execFile, spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { onTestFinished } from "vitest";

const runFile = promisify(execFile);

export const builtMainFile = fileURLToPath(
  new URL("../../dist/main.js", import.meta.url),
);

export interface CliRun {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function textField(options: { error: object; name: string }): string {
  const value: unknown = Reflect.get(options.error, options.name);
  return typeof value === "string" ? value : "";
}

function failedRunOf(error: unknown): CliRun {
  if (typeof error !== "object" || error === null) throw error;
  const code: unknown = Reflect.get(error, "code");
  return {
    exitCode: typeof code === "number" ? code : 1,
    stdout: textField({ error, name: "stdout" }),
    stderr: textField({ error, name: "stderr" }),
  };
}

export interface CliWorkspace {
  root: string;
  configurationDirectory: string;
  environment: NodeJS.ProcessEnv;
  run: (args: string[]) => Promise<CliRun>;
  runWithInput: (run: { args: string[]; input: string }) => Promise<CliRun>;
}

function runWithInput(options: {
  args: string[];
  input: string;
  environment: NodeJS.ProcessEnv;
}): Promise<CliRun> {
  const child = spawn(process.execPath, [builtMainFile, ...options.args], {
    env: options.environment,
  });
  const stdout: string[] = [];
  const stderr: string[] = [];
  child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk.toString()));
  child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk.toString()));
  child.stdin.end(options.input);
  const finished = Promise.withResolvers<CliRun>();
  child.on("error", finished.reject);
  child.on("close", (code) => {
    finished.resolve({
      exitCode: code ?? 1,
      stdout: stdout.join(""),
      stderr: stderr.join(""),
    });
  });
  return finished.promise;
}

export async function createCliWorkspace(options?: {
  home: "isolated" | "user";
}): Promise<CliWorkspace> {
  const root = await mkdtemp(join(tmpdir(), "yumekit-cli-"));
  const home = join(root, "home");
  await mkdir(home);
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const configurationDirectory = join(root, "config");
  const environment = {
    ...process.env,
    ...(options?.home === "user" ? {} : { HOME: home }),
    YUMEKIT_CONFIG_DIRECTORY: configurationDirectory,
    OPENAI_API_KEY: "",
  };
  return {
    root,
    configurationDirectory,
    environment,
    runWithInput: (run) => runWithInput({ ...run, environment }),
    run: async (args) => {
      try {
        const { stdout, stderr } = await runFile(
          process.execPath,
          [builtMainFile, ...args],
          { env: environment, timeout: 120_000 },
        );
        return { exitCode: 0, stdout, stderr };
      } catch (error) {
        return failedRunOf(error);
      }
    },
  };
}
