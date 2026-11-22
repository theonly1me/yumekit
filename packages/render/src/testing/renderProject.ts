import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createProject,
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

export function temporaryFolder(): Promise<string> {
  return mkdtemp(join(tmpdir(), "yumekit-render-test-"));
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
}): Promise<string> {
  const created = await createProject({
    folder: join(await temporaryFolder(), "project"),
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
