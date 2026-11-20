import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { ServerCommand } from "@yumekit/tools";

const bundledServerEntries: Record<
  string,
  { folder: string; passEnvironment?: string[] }
> = {
  sample: { folder: "sample-media" },
  openai: { folder: "openai-media" },
  fal: { folder: "fal-media", passEnvironment: ["FAL_KEY"] },
};

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
  for (const [name, entry] of Object.entries(bundledServerEntries)) {
    const mainFile = fileURLToPath(
      new URL(`../../../tools/${entry.folder}/dist/main.js`, import.meta.url),
    );
    if (await isFile(mainFile)) {
      servers[name] = {
        command: process.execPath,
        args: [mainFile],
        ...(entry.passEnvironment === undefined
          ? {}
          : { passEnvironment: entry.passEnvironment }),
      };
    }
  }
  return servers;
}
