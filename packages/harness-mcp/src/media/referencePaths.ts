import { join } from "node:path";
import type { JsonObject, ProjectSnapshot } from "@yumekit/project";
import type { HarnessFailure, Outcome } from "../results.js";

export interface ReferenceIds {
  referenceAssetIds: string[] | undefined;
  firstFrameAssetId: string | undefined;
}

function imagePathOf(options: {
  snapshot: ProjectSnapshot;
  projectFolder: string;
  assetId: string;
}): Outcome<string, HarnessFailure> {
  const { snapshot, assetId } = options;
  const asset = snapshot.assets.find(
    (candidate) => candidate.id === assetId && candidate.kind === "image",
  );
  if (asset !== undefined) {
    return { ok: true, value: join(options.projectFolder, asset.file) };
  }
  const imageIds = snapshot.assets
    .filter((candidate) => candidate.kind === "image")
    .map((candidate) => candidate.id);
  return {
    ok: false,
    failure: {
      kind: "asset-not-found",
      message: `The project has no image asset "${assetId}".`,
      hint: `Use one of these image asset ids: ${imageIds.length === 0 ? "none" : imageIds.join(", ")}. Or make the image with generate_asset or import_asset first.`,
    },
  };
}

export function referencePathsInput(options: {
  snapshot: ProjectSnapshot;
  projectFolder: string;
  ids: ReferenceIds;
}): Outcome<JsonObject, HarnessFailure> {
  const { snapshot, projectFolder, ids } = options;
  const referencePaths: string[] = [];
  for (const assetId of ids.referenceAssetIds ?? []) {
    const path = imagePathOf({ snapshot, projectFolder, assetId });
    if (!path.ok) return path;
    referencePaths.push(path.value);
  }
  const firstFrame =
    ids.firstFrameAssetId === undefined
      ? undefined
      : imagePathOf({
          snapshot,
          projectFolder,
          assetId: ids.firstFrameAssetId,
        });
  if (firstFrame !== undefined && !firstFrame.ok) return firstFrame;
  return {
    ok: true,
    value: {
      ...(ids.referenceAssetIds === undefined
        ? {}
        : { reference_image_paths: referencePaths }),
      ...(firstFrame === undefined
        ? {}
        : { first_frame_path: firstFrame.value }),
    },
  };
}

export function recordedInputOf(options: {
  input: JsonObject;
  ids: ReferenceIds;
}): JsonObject {
  const { input, ids } = options;
  return {
    ...input,
    ...(ids.referenceAssetIds === undefined
      ? {}
      : { reference_asset_ids: ids.referenceAssetIds }),
    ...(ids.firstFrameAssetId === undefined
      ? {}
      : { first_frame_asset_id: ids.firstFrameAssetId }),
  };
}
