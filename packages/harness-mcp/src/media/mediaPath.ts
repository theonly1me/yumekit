import { join } from "node:path";
import type { JsonObject, ProjectSnapshot } from "@yumekit/project";
import type { HarnessFailure, Outcome } from "../results.js";
import type { GenerateAssetInput } from "./generateAssetInput.js";

const missingTextByCapability: Partial<
  Record<GenerateAssetInput["capability"], string>
> = {
  sharper:
    "A sharper copy needs media_asset_id, the picture or the video clip to copy.",
  "talking-clip":
    "A talking clip needs media_asset_id, the picture or the video clip of the person.",
};

export function mediaPathInput(options: {
  snapshot: ProjectSnapshot;
  projectFolder: string;
  request: GenerateAssetInput;
}): Outcome<JsonObject, HarnessFailure> {
  const { snapshot, request } = options;
  const assetId = request.media_asset_id;
  const missingText = missingTextByCapability[request.capability];
  if (missingText === undefined) {
    if (assetId === undefined) return { ok: true, value: {} };
    return {
      ok: false,
      failure: {
        kind: "invalid-value",
        message: `media_asset_id is for a sharper copy or a talking clip, not for ${request.capability}.`,
        hint: "Leave out media_asset_id, or use the capability sharper or talking-clip.",
      },
    };
  }
  const usable = snapshot.assets.filter(
    (asset) => asset.kind === "image" || asset.kind === "video",
  );
  const asset = usable.find((candidate) => candidate.id === assetId);
  if (asset !== undefined) {
    return {
      ok: true,
      value: { media_path: join(options.projectFolder, asset.file) },
    };
  }
  const ids = usable.map((candidate) => candidate.id);
  return {
    ok: false,
    failure: {
      kind: "asset-not-found",
      message:
        assetId === undefined
          ? missingText
          : `The project has no picture or video asset "${assetId}".`,
      hint: `Use one of these asset ids: ${ids.length === 0 ? "none" : ids.join(", ")}.`,
    },
  };
}
