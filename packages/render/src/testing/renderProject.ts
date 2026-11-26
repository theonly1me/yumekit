import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { onTestFinished } from "vitest";
import {
  createProject,
  openProject,
  type Edit,
  type AudioClip,
  type JsonObject,
  type Output,
  type ProjectStore,
  type SceneTransition,
} from "@yumekit/project";

export const smallOutput: Output = {
  id: "wide",
  label: "Wide",
  widthPixels: 320,
  heightPixels: 180,
};

export interface TestClip {
  id: string;
  sceneId: string;
  startFrame: number;
  durationFrames: number;
  sceneStartFrame?: number;
  transition?: SceneTransition;
}

export interface FolderOfTheFile {
  folder: string;
  remove: () => Promise<void>;
}

export async function folderOfTheFile(): Promise<FolderOfTheFile> {
  const folder = await mkdtemp(join(tmpdir(), "yumekit-render-test-"));
  return {
    folder,
    remove: () => rm(folder, { recursive: true, force: true }),
  };
}

export async function temporaryFolder(): Promise<string> {
  const { folder, remove } = await folderOfTheFile();
  onTestFinished(remove);
  return folder;
}

export function moduleScene(options: {
  sceneId: string;
  code: string;
  props?: JsonObject;
}): Edit {
  return {
    kind: "putScene",
    scene: {
      id: options.sceneId,
      title: options.sceneId,
      notes: "",
      source: { kind: "module", props: options.props ?? {} },
    },
    code: options.code,
  };
}

export function sceneTracks(options: {
  outputId?: string;
  tracks: TestClip[][];
  audioClips?: AudioClip[];
}): Edit {
  return {
    kind: "setTimeline",
    timeline: {
      outputId: options.outputId ?? smallOutput.id,
      tracks: [
        ...[...options.tracks.entries()].map(([trackIndex, clips]) => ({
          id: `track-${String(trackIndex)}`,
          kind: "scene" as const,
          clips: clips.map((clip) => ({ sceneStartFrame: 0, ...clip })),
        })),
        ...(options.audioClips === undefined
          ? []
          : [
              {
                id: "sound",
                kind: "audio" as const,
                clips: options.audioClips,
              },
            ]),
      ],
    },
  };
}

export async function createRenderProject(options: {
  outputs?: Output[];
  edits: Edit[] | ((store: ProjectStore) => Promise<Edit[]>);
  projectFolder?: string;
}): Promise<string> {
  const created = await createProject({
    folder: options.projectFolder ?? join(await temporaryFolder(), "project"),
    name: "Render test",
    framesPerSecond: 30,
    outputs: options.outputs ?? [smallOutput],
  });
  if (!created.ok) {
    throw new Error(`createProject failed: ${created.failure.message}`);
  }
  const store = created.value;
  const edits =
    typeof options.edits === "function"
      ? await options.edits(store)
      : options.edits;
  const applied = await store.applyEdits(edits);
  if (!applied.ok) {
    throw new Error(`applyEdits failed: ${applied.failure.message}`);
  }
  return store.folder;
}

export async function changeProject(options: {
  folder: string;
  edits: Edit[];
}): Promise<void> {
  const opened = await openProject({ folder: options.folder });
  if (!opened.ok) {
    throw new Error(`openProject failed: ${opened.failure.message}`);
  }
  const applied = await opened.value.applyEdits(options.edits);
  if (!applied.ok) {
    throw new Error(`applyEdits failed: ${applied.failure.message}`);
  }
}
