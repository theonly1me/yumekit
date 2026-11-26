import { realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { configurationDirectory } from "@yumekit/tools";
import type { AccessFolders } from "./fileAccess.js";
import { readLeadPermissions } from "./leadPermissionsFile.js";

export async function keysFoldersOf(): Promise<string[]> {
  const folder = resolve(configurationDirectory());
  const real = await realpath(folder).catch(() => folder);
  return real === folder ? [folder] : [folder, real];
}

export async function accessFoldersOf(options: {
  projectFolder: string;
  onceFolders: readonly string[];
}): Promise<AccessFolders> {
  const stored = await readLeadPermissions(options.projectFolder);
  return {
    projectFolder: options.projectFolder,
    allowedFolders: [...stored.folders, ...options.onceFolders],
    keysFolders: await keysFoldersOf(),
  };
}
