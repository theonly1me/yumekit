import { stat } from "node:fs/promises";
import { folderSource } from "../folder/fileSources.js";
import { readState } from "../folder/readState.js";
import { loadHistory } from "../history/history.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import { createProjectStore, type ProjectStore } from "./projectStore.js";

export type OpenFailure =
  | { kind: "folder-not-found"; message: string }
  | { kind: "not-a-project"; message: string }
  | { kind: "invalid-file"; file: string; message: string }
  | { kind: "unsupported-format-version"; message: string };

async function isFolder(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

export async function openProject(options: {
  folder: string;
}): Promise<Outcome<ProjectStore, OpenFailure>> {
  const { folder } = options;
  if (!(await isFolder(folder))) {
    return fail({
      kind: "folder-not-found",
      message: `The folder "${folder}" does not exist.`,
    });
  }
  const source = folderSource(folder);
  if ((await source.read("project.json")) === undefined) {
    return fail({
      kind: "not-a-project",
      message: `The folder "${folder}" has no project.json file.`,
    });
  }
  const state = await readState(source);
  if (!state.ok) {
    return state;
  }
  const history = await loadHistory(folder);
  if (!history.ok) {
    return history;
  }
  return succeed(
    createProjectStore({ folder, state: state.value, history: history.value }),
  );
}
