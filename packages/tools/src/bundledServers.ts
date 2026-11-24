import { stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { ServerCommand } from "./types.js";

const resolveFromTools = createRequire(import.meta.url);

interface BundledServer {
  folder: string;
  passEnvironment?: string[];
}

const bundledServersByName: Record<string, BundledServer> = {
  sample: { folder: "sample-media" },
  openai: {
    folder: "openai-media",
    passEnvironment: [
      "OPENAI_API_KEY",
      "YUMEKIT_OPENAI_IMAGE_MODEL",
      "YUMEKIT_OPENAI_SPEECH_MODEL",
      "YUMEKIT_OPENAI_ALIGN_MODEL",
    ],
  },
  gemini: {
    folder: "gemini-media",
    passEnvironment: [
      "GEMINI_API_KEY",
      "YUMEKIT_GEMINI_VIDEO_MODEL",
      "YUMEKIT_GEMINI_VIDEO_USD_PER_MILLION_TOKENS",
    ],
  },
  fal: { folder: "fal-media", passEnvironment: ["FAL_KEY"] },
  "local-voice": {
    folder: "local-voice",
    passEnvironment: ["YUMEKIT_CONFIG_DIRECTORY"],
  },
  "local-music": { folder: "local-music" },
  codex: {
    folder: "codex-images",
    passEnvironment: ["CODEX_HOME", "YUMEKIT_CODEX_PATH"],
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
    const mainFile = join(
      dirname(
        resolveFromTools.resolve(`@yumekit/${bundled.folder}/package.json`),
      ),
      "dist",
      "main.js",
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
