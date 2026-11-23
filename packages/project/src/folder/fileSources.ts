import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  sharedCodeNameOfFile,
  sharedFolder,
  sharedFolderName,
  type ProjectFiles,
} from "./projectFiles.js";
import type { FileSource } from "./readJsonFile.js";

function isMissingError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "ENOENT" || error.code === "ENOTDIR")
  );
}

async function readFileIfPresent(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (isMissingError(error)) {
      return undefined;
    }
    throw error;
  }
}

async function listSceneFolders(folder: string): Promise<string[]> {
  try {
    const entries = await readdir(join(folder, "scenes"), {
      withFileTypes: true,
    });
    return entries
      .filter((entry) => entry.isDirectory() && entry.name !== sharedFolderName)
      .map((entry) => entry.name)
      .toSorted();
  } catch (error) {
    if (isMissingError(error)) {
      return [];
    }
    throw error;
  }
}

async function listSharedCodeNames(folder: string): Promise<string[]> {
  try {
    const entries = await readdir(join(folder, "scenes", sharedFolderName), {
      withFileTypes: true,
    });
    return entries
      .map((entry) => sharedCodeNameOfFile(`${sharedFolder}/${entry.name}`))
      .filter((name) => name !== undefined)
      .toSorted();
  } catch (error) {
    if (isMissingError(error)) {
      return [];
    }
    throw error;
  }
}

export function folderSource(folder: string): FileSource {
  return {
    read: (file) => readFileIfPresent(join(folder, file)),
    sceneIds: () => listSceneFolders(folder),
    sharedCodeNames: () => listSharedCodeNames(folder),
  };
}

export function filesSource(files: ProjectFiles): FileSource {
  return {
    read: (file) => Promise.resolve(files.get(file)),
    sceneIds: () =>
      Promise.resolve(
        [...files.keys()]
          .map((file) => /^scenes\/([^/]+)\/scene\.json$/.exec(file)?.[1])
          .filter((sceneId) => sceneId !== undefined)
          .toSorted(),
      ),
    sharedCodeNames: () =>
      Promise.resolve(
        [...files.keys()]
          .map(sharedCodeNameOfFile)
          .filter((name) => name !== undefined)
          .toSorted(),
      ),
  };
}
