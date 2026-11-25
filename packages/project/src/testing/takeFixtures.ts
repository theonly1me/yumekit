import type { ProjectStore, Shot, StoryPlan } from "../index.js";
import { createTestProject, writeProjectFile } from "./projectFixtures.js";

export function shotOf(shotId: string): Shot {
  return {
    id: shotId,
    purpose: `The purpose of ${shotId}`,
    action: `The action of ${shotId}`,
    placeId: "harbor",
    castIds: [],
    camera: { size: "wide", angle: "eye-level" },
    seconds: 4,
    startState: [],
    endState: [],
    inherits: "",
  };
}

export function planOf(shotIds: string[]): StoryPlan {
  return {
    logline: "A ferry crosses the strait in fog.",
    want: "to cross",
    obstacle: "the fog",
    change: "the ferry lands",
    shots: shotIds.map(shotOf),
  };
}

export async function projectWithPlan(
  shotIds: string[],
): Promise<ProjectStore> {
  const store = await createTestProject();
  const applied = await store.applyEdits([
    {
      kind: "setBible",
      bible: { ...store.read().bible, storyPlan: planOf(shotIds) },
    },
  ]);
  if (!applied.ok) throw new Error(applied.failure.message);
  return store;
}

export async function addPicture(options: {
  store: ProjectStore;
  assetId: string;
  shotId?: string | undefined;
}): Promise<void> {
  const { store, assetId, shotId } = options;
  const file = `assets/files/${assetId}.png`;
  await writeProjectFile({ folder: store.folder, file, content: assetId });
  const applied = await store.applyEdits([
    {
      kind: "addAsset",
      asset: {
        id: assetId,
        kind: "image",
        file,
        widthPixels: 64,
        heightPixels: 36,
        source: {
          kind: "tool",
          server: "sample",
          tool: "generate_image",
          input: {
            prompt: assetId,
            ...(shotId === undefined ? {} : { shot_id: shotId }),
          },
        },
      },
    },
  ]);
  if (!applied.ok) throw new Error(applied.failure.message);
}

export const firstTime = "2026-11-26T10:00:00.000Z";
export const secondTime = "2026-11-26T10:05:00.000Z";
export const thirdTime = "2026-11-26T10:09:00.000Z";
