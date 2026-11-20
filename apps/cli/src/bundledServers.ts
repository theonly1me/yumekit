import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { ServerCommand } from "@yumekit/tools";

const bundledServerFolders = {
  sample: "sample-media",
  openai: "openai-media",
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
  for (const [name, folder] of Object.entries(bundledServerFolders)) {
    const mainFile = fileURLToPath(
      new URL(`../../../tools/${folder}/dist/main.js`, import.meta.url),
    );
    if (await isFile(mainFile)) {
      servers[name] = { command: process.execPath, args: [mainFile] };
    }
  }
  return servers;
}
