import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { ServerCommand } from "@yumekit/tools";

const bundledServers = {
  sample: { folder: "sample-media", passEnvironment: [] },
  openai: {
    folder: "openai-media",
    passEnvironment: [
      "OPENAI_API_KEY",
      "YUMEKIT_OPENAI_IMAGE_MODEL",
      "YUMEKIT_OPENAI_SPEECH_MODEL",
      "YUMEKIT_OPENAI_ALIGN_MODEL",
    ],
  },
} as const;

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

export async function findBundledServers(): Promise<
  Record<string, ServerCommand>
> {
  const servers: Record<string, ServerCommand> = {};
  for (const [name, { folder, passEnvironment }] of Object.entries(
    bundledServers,
  )) {
    const mainFile = fileURLToPath(
      new URL(`../../../tools/${folder}/dist/main.js`, import.meta.url),
    );
    if (await isFile(mainFile)) {
      servers[name] = {
        command: process.execPath,
        args: [mainFile],
        passEnvironment: [...passEnvironment],
      };
    }
  }
  return servers;
}
