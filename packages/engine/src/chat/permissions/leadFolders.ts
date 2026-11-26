import { realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import type { Outcome } from "../../engineTypes.js";
import { keysFoldersOf } from "./accessFolders.js";
import { expandedPathOf, isPathWithin } from "./fileAccess.js";
import {
  changeLeadPermissions,
  readLeadPermissions,
  withoutRepeats,
} from "./leadPermissionsFile.js";

export interface FolderFailure {
  kind:
    | "folder-not-valid"
    | "folder-not-found"
    | "folder-holds-keys"
    | "folder-in-project"
    | "folders-not-written";
  message: string;
}

export interface AddedFolder {
  folder: string;
  note: string | undefined;
}

const commonFolders = [
  "Desktop",
  "Documents",
  "Downloads",
  "Movies",
  "Pictures",
  "Music",
];

export const keysInsideNote =
  "The folder of your yumekit keys inside it stays closed to the AI.";

function failed(failure: FolderFailure): { ok: false; failure: FolderFailure } {
  return { ok: false, failure };
}

async function isFolder(path: string): Promise<boolean> {
  return stat(path).then(
    (found) => found.isDirectory(),
    () => false,
  );
}

async function checkedFolderOf(options: {
  typed: string;
  projectFolder: string;
}): Promise<Outcome<string, FolderFailure>> {
  const typed = options.typed.trim();
  const isWhole = typed.startsWith("~") || isAbsolute(typed);
  if (typed === "" || !isWhole) {
    return failed({
      kind: "folder-not-valid",
      message: "Write the whole path of a folder, for example ~/Movies.",
    });
  }
  const expanded = expandedPathOf({ path: typed, projectFolder: "/" });
  if (!(await isFolder(expanded))) {
    return failed({
      kind: "folder-not-found",
      message: `There is no folder at ${expanded}.`,
    });
  }
  return { ok: true, value: await realpath(expanded) };
}

export async function addLeadFolder(options: {
  typed: string;
  projectFolder: string;
}): Promise<Outcome<AddedFolder, FolderFailure>> {
  const checked = await checkedFolderOf(options);
  if (!checked.ok) return checked;
  const folder = checked.value;
  const keysFolders = await keysFoldersOf();
  if (
    keysFolders.some((keys) => isPathWithin({ folder: keys, path: folder }))
  ) {
    return failed({
      kind: "folder-holds-keys",
      message:
        "This folder holds your yumekit keys, so the AI may never read it.",
    });
  }
  if (isPathWithin({ folder: options.projectFolder, path: folder })) {
    return failed({
      kind: "folder-in-project",
      message: "The AI already reads each folder of the project.",
    });
  }
  const changed = await changeLeadPermissions({
    projectFolder: options.projectFolder,
    change: (stored) => ({
      ...stored,
      folders: withoutRepeats([...stored.folders, folder]),
    }),
  });
  if (changed === undefined) {
    return failed({
      kind: "folders-not-written",
      message: "yumekit could not save the folders of this project.",
    });
  }
  const holdsKeys = keysFolders.some((keys) =>
    isPathWithin({ folder, path: keys }),
  );
  return {
    ok: true,
    value: { folder, note: holdsKeys ? keysInsideNote : undefined },
  };
}

export async function removeLeadFolder(options: {
  folder: string;
  projectFolder: string;
}): Promise<boolean> {
  const changed = await changeLeadPermissions({
    projectFolder: options.projectFolder,
    change: (stored) => ({
      ...stored,
      folders: stored.folders.filter((folder) => folder !== options.folder),
    }),
  });
  return changed !== undefined;
}

export async function removeLeadRule(options: {
  rule: string;
  projectFolder: string;
}): Promise<boolean> {
  const changed = await changeLeadPermissions({
    projectFolder: options.projectFolder,
    change: (stored) => ({
      ...stored,
      rules: stored.rules.filter((rule) => rule !== options.rule),
    }),
  });
  return changed !== undefined;
}

export async function suggestedFoldersOf(
  projectFolder: string,
): Promise<string[]> {
  const stored = await readLeadPermissions(projectFolder);
  const candidates = commonFolders.map((name) => join(homedir(), name));
  const found = await Promise.all(
    candidates.map(async (folder) => {
      if (!(await isFolder(folder))) return [];
      const real = await realpath(folder);
      return stored.folders.includes(real) ? [] : [real];
    }),
  );
  return found.flat();
}
