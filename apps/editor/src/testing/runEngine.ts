import { execFile, spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const runFile = promisify(execFile);
const cliMainFile = fileURLToPath(
  new URL("../../../cli/dist/main.js", import.meta.url),
);
const urlPattern = /http:\/\/127\.0\.0\.1:\d+\/\?token=[0-9a-f]{64}/;
const startWaitMilliseconds = 60_000;

export interface RunningEngine {
  url: string;
  origin: string;
  token: string;
  projectFolder: string;
  callTool: (call: { name: string; input: object }) => Promise<unknown>;
  stop: () => Promise<void>;
  remove: () => Promise<void>;
}

export interface EngineOptions {
  mediaTools?: object;
}

async function createProject(options: EngineOptions): Promise<{
  root: string;
  folder: string;
  environment: NodeJS.ProcessEnv;
}> {
  const root = await mkdtemp(join(tmpdir(), "yumekit-editor-"));
  const home = join(root, "home");
  await mkdir(home);
  const environment = {
    ...process.env,
    HOME: home,
    YUMEKIT_CONFIG_DIRECTORY: join(root, "config"),
    OPENAI_API_KEY: "",
    GEMINI_API_KEY: "",
    FAL_KEY: "",
    YUMEKIT_EDITOR_TEST_KEY: "",
  };
  const folder = join(root, "project");
  await runFile(
    process.execPath,
    [
      cliMainFile,
      "init",
      folder,
      "--name",
      "Editor test",
      "--output",
      "wide:320x180",
      "--output",
      "tall:180x320",
    ],
    { env: environment },
  );
  if (options.mediaTools !== undefined) {
    await writeFile(
      join(folder, "media-tools.json"),
      JSON.stringify(options.mediaTools),
    );
  }
  return { root, folder, environment };
}

export async function runEngine(
  options: EngineOptions = {},
): Promise<RunningEngine> {
  const { root, folder, environment } = await createProject(options);
  const child = spawn(
    process.execPath,
    [cliMainFile, "open", folder, "--no-browser"],
    { env: environment, stdio: ["ignore", "pipe", "pipe"] },
  );
  const output: string[] = [];
  child.stdout.on("data", (chunk: Buffer) => output.push(chunk.toString()));
  child.stderr.on("data", (chunk: Buffer) => output.push(chunk.toString()));
  const exited = new Promise<void>((resolve) => {
    child.on("exit", () => {
      resolve();
    });
  });
  const deadline = Date.now() + startWaitMilliseconds;
  let match = urlPattern.exec(output.join(""));
  while (match === null && Date.now() < deadline && child.exitCode === null) {
    await delay(50);
    match = urlPattern.exec(output.join(""));
  }
  const [url] = match ?? [];
  if (url === undefined) {
    throw new Error(`yumekit open did not start: ${output.join("")}`);
  }
  const parsed = new URL(url);
  const token = parsed.searchParams.get("token") ?? "";
  const stop = async () => {
    if (child.exitCode === null) child.kill("SIGTERM");
    await exited;
  };
  return {
    url,
    origin: parsed.origin,
    token,
    projectFolder: folder,
    callTool: async (call) => {
      const response = await fetch(`${parsed.origin}/api/tools/${call.name}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ input: call.input }),
      });
      const result: unknown = await response.json();
      if (
        typeof result !== "object" ||
        result === null ||
        !("isError" in result) ||
        result.isError !== false
      ) {
        throw new Error(`${call.name} failed: ${JSON.stringify(result)}`);
      }
      return result;
    },
    stop,
    remove: async () => {
      await stop();
      await rm(root, { recursive: true, force: true });
    },
  };
}
