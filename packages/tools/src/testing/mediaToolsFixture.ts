import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { onTestFinished, vi } from "vitest";
import { connectMediaTools } from "../connectMediaTools.js";
import type { MediaTools, ServerCommand } from "../types.js";

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

export async function connectFixture(options: {
  projectFile?: object;
  userFile?: object;
  bundledServers?: Record<string, ServerCommand>;
}): Promise<MediaToolsFixture> {
  const root = await mkdtemp(join(tmpdir(), "yumekit-tools-"));
  const home = join(root, "home");
  const projectFolder = join(root, "project");
  await mkdir(join(home, ".config", "yumekit"), { recursive: true });
  await mkdir(projectFolder);
  vi.stubEnv("HOME", home);
  onTestFinished(async () => {
    vi.unstubAllEnvs();
    await rm(root, { recursive: true, force: true });
  });
  if (options.userFile) {
    await writeFile(
      join(home, ".config", "yumekit", "media-tools.json"),
      JSON.stringify(options.userFile),
    );
  }
  if (options.projectFile) {
    await writeFile(
      join(projectFolder, "media-tools.json"),
      JSON.stringify(options.projectFile),
    );
  }
  const tools = await connectMediaTools({
    projectFolder,
    bundledServers: options.bundledServers ?? { sample: sampleServerCommand },
  });
  onTestFinished(() => tools.close());
  return {
    tools,
    projectFolder,
    outputDirectory: join(projectFolder, "assets"),
  };
}
