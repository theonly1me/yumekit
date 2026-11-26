import { constants } from "node:fs";
import { copyFile, mkdir, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { fileNameOfProject } from "@yumekit/harness-mcp";
import type { Outcome } from "../engineTypes.js";

export const exportsFolderName = "exports";

const largestNumber = 999;

export function exportsFolderOf(projectFolder: string): string {
  return join(projectFolder, exportsFolderName);
}

export function exportNameOf(options: {
  renderFile: string;
  projectName: string;
  platformId: string | undefined;
}): string {
  const name = basename(options.renderFile);
  return options.platformId === undefined
    ? `${fileNameOfProject(options.projectName)}-${name}`
    : name;
}

function numberedNameOf(options: { name: string; number: number }): string {
  if (options.number === 1) return options.name;
  const extension = extname(options.name);
  const stem = options.name.slice(0, options.name.length - extension.length);
  return `${stem}-${String(options.number)}${extension}`;
}

export interface PlacedExport {
  path: string;
  bytes: number;
}

export interface PlaceFailure {
  kind: "export-not-copied";
  message: string;
}

function isNameTaken(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "EEXIST";
}

function notCopied(message: string): { ok: false; failure: PlaceFailure } {
  return { ok: false, failure: { kind: "export-not-copied", message } };
}

export async function placeExport(options: {
  projectFolder: string;
  renderFile: string;
  name: string;
}): Promise<Outcome<PlacedExport, PlaceFailure>> {
  const folder = exportsFolderOf(options.projectFolder);
  try {
    await mkdir(folder, { recursive: true });
  } catch (error) {
    return notCopied(
      `yumekit could not make the exports folder: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  for (let number = 1; number <= largestNumber; number += 1) {
    const path = join(folder, numberedNameOf({ name: options.name, number }));
    try {
      await copyFile(
        options.renderFile,
        path,
        constants.COPYFILE_EXCL | constants.COPYFILE_FICLONE,
      );
      return { ok: true, value: { path, bytes: (await stat(path)).size } };
    } catch (error) {
      if (!isNameTaken(error)) {
        return notCopied(
          `The file could not go to the exports folder: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
  return notCopied(
    `The exports folder has ${String(largestNumber)} files named like ${options.name}. Move some of them, and export again.`,
  );
}
