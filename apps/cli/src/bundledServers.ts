import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { ServerCommand } from "@yumekit/tools";

interface BundledServer {
  folder: string;
  passEnvironment?: string[];
}

const bundledServersByName: Record<string, BundledServer> = {
  sample: { folder: "sample-media" },
  openai: { folder: "openai-media" },
  gemini: {
    folder: "gemini-media",
    passEnvironment: [
      "GEMINI_API_KEY",
      "YUMEKIT_GEMINI_VIDEO_MODEL",
      "YUMEKIT_GEMINI_VIDEO_USD_PER_MILLION_TOKENS",
    ],
  },
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
  for (const [name, bundled] of Object.entries(bundledServersByName)) {
    const mainFile = fileURLToPath(
      new URL(`../../../tools/${bundled.folder}/dist/main.js`, import.meta.url),
    );
    if (await isFile(mainFile)) {
      servers[name] = {
        command: process.execPath,
        args: [mainFile],
        ...(bundled.passEnvironment
          ? { passEnvironment: bundled.passEnvironment }
          : {}),
      };
    }
  }
  return servers;
}
