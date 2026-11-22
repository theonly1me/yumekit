import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { prettifyError } from "zod";
import { syncFiles } from "../folder/syncFiles.js";
import { projectFilesOf } from "../folder/projectFiles.js";
import { writeFileAtomic } from "../folder/writeFileAtomic.js";
import {
  projectSchema,
  type Output,
  type Project,
  type VideoStyle,
} from "../format/project.js";
import type { ProjectState } from "../format/state.js";
import { emptyHistory } from "../history/history.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import { checkRules } from "../rules/index.js";
import { createProjectStore, type ProjectStore } from "./projectStore.js";

export type CreateFailure =
  | { kind: "folder-not-empty"; message: string }
  | { kind: "invalid-value"; message: string };

async function isEmptyOrMissing(folder: string): Promise<boolean> {
  try {
    return (await readdir(folder)).length === 0;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return true;
    }
    if (error instanceof Error && "code" in error && error.code === "ENOTDIR") {
      return false;
    }
    throw error;
  }
}

interface NewProject {
  name: string;
  framesPerSecond: Project["framesPerSecond"];
  outputs: Output[];
  videoStyle?: VideoStyle;
}

function initialState(
  options: NewProject,
): Outcome<ProjectState, CreateFailure> {
  const project = projectSchema.safeParse({ formatVersion: 1, ...options });
  if (!project.success) {
    return fail({
      kind: "invalid-value",
      message: prettifyError(project.error),
    });
  }
  const state: ProjectState = {
    project: project.data,
    script: "",
    bible: { style: "", palette: [], cast: [], voice: "" },
    scenes: [],
    sceneCode: {},
    timelines: project.data.outputs.map((output) => ({
      outputId: output.id,
      tracks: [],
    })),
    assets: [],
    words: {},
  };
  const ruleFailure = checkRules(state);
  if (ruleFailure !== undefined) {
    return fail({ kind: "invalid-value", message: ruleFailure.message });
  }
  return succeed(state);
}

export async function createProject(
  options: NewProject & { folder: string },
): Promise<Outcome<ProjectStore, CreateFailure>> {
  const { folder, ...newProject } = options;
  const state = initialState(newProject);
  if (!state.ok) {
    return state;
  }
  if (!(await isEmptyOrMissing(folder))) {
    return fail({
      kind: "folder-not-empty",
      message: `The path "${folder}" is not an empty folder.`,
    });
  }
  await mkdir(join(folder, "assets", "files"), { recursive: true });
  await syncFiles({
    folder,
    previous: new Map(),
    next: projectFilesOf(state.value),
  });
  await writeFileAtomic({
    path: join(folder, ".gitignore"),
    content:
      "renders/\n.yumekit/\n.cache/\n.mcp.json\n.codex/config.toml\n.cursor/mcp.json\n",
  });
  return succeed(
    createProjectStore({ folder, state: state.value, history: emptyHistory }),
  );
}
