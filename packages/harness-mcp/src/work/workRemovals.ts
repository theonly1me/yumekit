import { assetUsesOf, type Edit, type ProjectSnapshot } from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../inputs.js";
import type { HarnessFailure } from "../results.js";
import type { PutWorkInput } from "./putWorkInput.js";

export const mostRemovals = 64;

export const workRemovalsInput = z
  .strictObject({
    scene_ids: z
      .array(idInput("The id of a scene to remove."))
      .max(mostRemovals)
      .optional()
      .describe(
        "Scenes to remove, for example scenes that you made to look at a file. No clip of the new timelines may show them.",
      ),
    asset_ids: z
      .array(idInput("The id of an asset to remove."))
      .max(mostRemovals)
      .optional()
      .describe(
        "Assets to remove, for example a music file that you made again. No scene, clip, cast member, or font may use them.",
      ),
  })
  .optional()
  .describe(
    "Scenes and assets to remove in the same change, after the scenes and the timelines of this call.",
  );

export function removalEditsOf(input: PutWorkInput): Edit[] {
  return [
    ...(input.remove?.scene_ids ?? []).map((sceneId): Edit => ({
      kind: "removeScene",
      sceneId,
    })),
    ...(input.remove?.asset_ids ?? []).map((assetId): Edit => ({
      kind: "removeAsset",
      assetId,
    })),
  ];
}

export function removedAssetInUse(options: {
  input: PutWorkInput;
  snapshot: ProjectSnapshot;
}): HarnessFailure | undefined {
  const { input, snapshot } = options;
  const removedSceneIds = new Set(input.remove?.scene_ids ?? []);
  const callScenes = (input.scenes ?? []).map((scene) => ({
    id: scene.scene_id,
    source: { props: scene.props ?? {} },
  }));
  const callSceneIds = new Set(callScenes.map((scene) => scene.id));
  const scenes = [
    ...snapshot.scenes.filter((scene) => !callSceneIds.has(scene.id)),
    ...callScenes,
  ].filter((scene) => !removedSceneIds.has(scene.id));
  for (const assetId of input.remove?.asset_ids ?? []) {
    const [use] = assetUsesOf({ project: { scenes, timelines: [] }, assetId });
    if (use?.kind === "scene") {
      return {
        kind: "asset-in-use",
        message: `The asset "${assetId}" is used by the scene "${use.sceneId}" after this call.`,
        hint: "Change or remove that scene in the same call, or keep the asset.",
      };
    }
  }
  return undefined;
}
