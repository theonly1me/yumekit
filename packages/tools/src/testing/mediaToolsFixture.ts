import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { onTestFinished, vi } from "vitest";
import { connectMediaTools } from "../connectMediaTools.js";
import type {
  ConnectFailure,
  MediaTools,
  Outcome,
  ServerCommand,
} from "../types.js";

export const sampleServerCommand: ServerCommand = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL("../../../../tools/sample-media/src/main.ts", import.meta.url),
    ),
  ],
};

export const fakeServerCommand: ServerCommand = {
  command: process.execPath,
  args: [fileURLToPath(new URL("./fakeMediaServer.ts", import.meta.url))],
};

export const missingServerCommand: ServerCommand = {
  command: "yumekit-command-that-does-not-exist",
  args: [],
};

export interface MediaToolsFixture {
  tools: MediaTools;
  projectFolder: string;
  outputDirectory: string;
}

export interface FixtureOptions {
  projectFile?: object | string;
  userFile?: object | string;
  bundledServers?: Record<string, ServerCommand>;
  toolTimeoutSeconds?: number;
  beforeConnect?: () => Promise<unknown>;
}

function fileText(content: object | string): string {
  return typeof content === "string" ? content : JSON.stringify(content);
}

export async function connectFixtureOutcome(options: FixtureOptions): Promise<{
  outcome: Outcome<MediaTools, ConnectFailure>;
  home: string;
  projectFolder: string;
}> {
  const root = await mkdtemp(join(tmpdir(), "yumekit-tools-"));
  const home = join(root, "home");
  const projectFolder = join(root, "project");
  await mkdir(join(home, ".config", "yumekit"), { recursive: true });
  await mkdir(projectFolder);
  vi.stubEnv("HOME", home);
  vi.stubEnv("YUMEKIT_CONFIG_DIRECTORY", join(home, ".config", "yumekit"));
  onTestFinished(async () => {
    vi.unstubAllEnvs();
    await rm(root, { recursive: true, force: true });
  });
  if (options.userFile) {
    await writeFile(
      join(home, ".config", "yumekit", "media-tools.json"),
      fileText(options.userFile),
    );
  }
  if (options.projectFile) {
    await writeFile(
      join(projectFolder, "media-tools.json"),
      fileText(options.projectFile),
    );
  }
  await options.beforeConnect?.();
  const outcome = await connectMediaTools({
    projectFolder,
    bundledServers: options.bundledServers ?? { sample: sampleServerCommand },
    ...(options.toolTimeoutSeconds === undefined
      ? {}
      : { toolTimeoutSeconds: options.toolTimeoutSeconds }),
  });
  if (outcome.ok) onTestFinished(() => outcome.value.close());
  return { outcome, home, projectFolder };
}

export async function connectFixture(
  options: FixtureOptions,
): Promise<MediaToolsFixture> {
  const { outcome, projectFolder } = await connectFixtureOutcome(options);
  if (!outcome.ok) throw new Error(outcome.failure.message);
  return {
    tools: outcome.value,
    projectFolder,
    outputDirectory: join(projectFolder, "assets"),
  };
}

export const keyedServerCommand: ServerCommand = {
  command: process.execPath,
  args: [fileURLToPath(new URL("./keyedMediaServer.ts", import.meta.url))],
  passEnvironment: ["YUMEKIT_TEST_KEY"],
};

export const testKeyValue = "yumekit-test-key-7f3a9c";
