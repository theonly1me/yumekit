import { spawn } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { cliMainFile } from "./runEngine.js";

const fakeAgentFile = fileURLToPath(
  new URL("./fakeMakingAgent.ts", import.meta.url),
);
const urlPattern = /http:\/\/127\.0\.0\.1:\d+\/\?token=[0-9a-f]{64}/;

export interface FakeMaking {
  calls: { name: string; input: object }[];
  restCalls?: { name: string; input: object }[];
  ending: "done" | "failed";
}

export interface RunningHome {
  url: string;
  root: string;
  projectsFolder: string;
  finishRequest: () => Promise<void>;
  finishRest: () => Promise<void>;
  remove: () => Promise<void>;
}

async function writeAgent(options: { root: string; making: FakeMaking }) {
  const folder = join(options.root, "bin");
  await mkdir(folder);
  const programPath = join(folder, "claude");
  await writeFile(
    programPath,
    `#!/bin/sh\nexec "${process.execPath}" "${fakeAgentFile}" "$@"\n`,
  );
  await chmod(programPath, 0o755);
  const waitFile = join(options.root, "finish-request");
  const restWaitFile = join(options.root, "finish-rest");
  const scenarioFile = join(options.root, "making.json");
  await writeFile(
    scenarioFile,
    JSON.stringify({ ...options.making, waitFile, restWaitFile }),
  );
  return { folder, programPath, waitFile, restWaitFile, scenarioFile };
}

export async function runHome(options: {
  making: FakeMaking | "no-agent";
  browsersPath?: string;
  mediaTools?: object;
}): Promise<RunningHome> {
  const root = await mkdtemp(join(tmpdir(), "yumekit-home-"));
  const configurationDirectory = join(root, "config");
  const projectsFolder = join(root, "projects");
  await mkdir(join(root, "home"));
  await mkdir(configurationDirectory);
  const agent =
    options.making === "no-agent"
      ? undefined
      : await writeAgent({ root, making: options.making });
  await writeFile(
    join(configurationDirectory, "settings.json"),
    JSON.stringify({
      projectsFolder,
      ...(agent === undefined
        ? {}
        : { agentPrograms: { "claude-code": agent.programPath } }),
    }),
  );
  if (options.mediaTools !== undefined) {
    await writeFile(
      join(configurationDirectory, "media-tools.json"),
      JSON.stringify(options.mediaTools),
    );
  }
  const environment = {
    ...process.env,
    HOME: join(root, "home"),
    PATH: ["/usr/bin", "/bin"].join(delimiter),
    PLAYWRIGHT_BROWSERS_PATH: options.browsersPath ?? join(root, "none"),
    YUMEKIT_CONFIG_DIRECTORY: configurationDirectory,
    YUMEKIT_FAKE_MAKING: agent?.scenarioFile ?? "",
    OPENAI_API_KEY: "",
    GEMINI_API_KEY: "",
    FAL_KEY: "",
  };
  const child = spawn(process.execPath, [cliMainFile, "--no-browser"], {
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output: string[] = [];
  child.stdout.on("data", (chunk: Buffer) => output.push(chunk.toString()));
  child.stderr.on("data", (chunk: Buffer) => output.push(chunk.toString()));
  const exited = new Promise<void>((resolve) => {
    child.on("exit", () => {
      resolve();
    });
  });
  let match = urlPattern.exec(output.join(""));
  for (let attempt = 0; match === null && attempt < 600; attempt += 1) {
    await delay(50);
    match = urlPattern.exec(output.join(""));
  }
  const [url] = match ?? [];
  if (url === undefined) {
    throw new Error(`yumekit did not start: ${output.join("")}`);
  }
  return {
    url,
    root,
    projectsFolder,
    finishRequest: async () => {
      if (agent !== undefined) await writeFile(agent.waitFile, "");
    },
    finishRest: async () => {
      if (agent !== undefined) await writeFile(agent.restWaitFile, "");
    },
    remove: async () => {
      if (child.exitCode === null) child.kill("SIGTERM");
      await exited;
      await rm(root, { recursive: true, force: true });
    },
  };
}
