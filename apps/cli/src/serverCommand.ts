import { realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ServerCommand } from "@yumekit/engine";

const mainFile = fileURLToPath(new URL("./main.js", import.meta.url));

export async function realFolderOf(folder: string): Promise<string> {
  const resolved = resolve(folder);
  return realpath(resolved).catch(() => resolved);
}

export function serverCommandOf(projectFolder: string): ServerCommand {
  return {
    command: process.execPath,
    args: [mainFile, "mcp", "--project", projectFolder],
  };
}
