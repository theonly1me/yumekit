import type { Asset, AssetRegion } from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../inputs.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { markNameInput, regionInput } from "./markInputs.js";

export const mostPreviewedAssets = 16;

const assetLookInput = z.strictObject({
  asset_id: idInput("The id of a video or a picture asset."),
  region: regionInput
    .optional()
    .describe(
      "Look closer: show only this part of the picture, as shares from 0 to 1.",
    ),
  mark: markNameInput
    .optional()
    .describe(
      "A mark of the asset. Its region and its time replace region and from_seconds.",
    ),
  from_seconds: z
    .number()
    .min(0)
    .optional()
    .describe("A video only: the first second to show. Default 0."),
  to_seconds: z
    .number()
    .gt(0)
    .optional()
    .describe("A video only: the last second to show. Default the end."),
  count: z
    .int()
    .min(2)
    .max(24)
    .optional()
    .describe("A video only: how many frames the sheet shows. Default 12."),
});

export const previewAssetsInput = {
  assets: z
    .array(assetLookInput)
    .min(1)
    .max(mostPreviewedAssets)
    .describe(
      `1 to ${String(mostPreviewedAssets)} assets to look at, each with an optional region, mark, and time range.`,
    ),
};

export type AssetLook = z.infer<typeof assetLookInput>;

export interface PlannedLook {
  asset: Asset;
  kind: "image" | "video";
  region: AssetRegion | undefined;
  fromSeconds: number | undefined;
  toSeconds: number | undefined;
  count: number | undefined;
}

function lookFailure(options: {
  kind: string;
  message: string;
  hint: string;
}): Outcome<PlannedLook, HarnessFailure> {
  return { ok: false, failure: options };
}

export function plannedLookOf(options: {
  assets: Asset[];
  look: AssetLook;
}): Outcome<PlannedLook, HarnessFailure> {
  const { look } = options;
  const asset = options.assets.find(
    (candidate) => candidate.id === look.asset_id,
  );
  if (asset === undefined) {
    return lookFailure({
      kind: "asset-not-found",
      message: `The project has no asset "${look.asset_id}".`,
      hint: `Use one of these asset ids: ${options.assets.map((candidate) => candidate.id).join(", ") || "none"}.`,
    });
  }
  if (asset.kind !== "video" && asset.kind !== "image") {
    return lookFailure({
      kind: "asset-has-no-picture",
      message: `The asset "${asset.id}" is ${asset.kind === "audio" ? "a sound" : "a font"}, not a video or a picture.`,
      hint: "Give the id of a video or a picture asset. list_assets gives the kind of each.",
    });
  }
  const mark =
    look.mark === undefined
      ? undefined
      : (asset.marks ?? []).find(
          (candidate) =>
            candidate.name.trim().toLowerCase() ===
            look.mark?.trim().toLowerCase(),
        );
  if (look.mark !== undefined && mark === undefined) {
    return lookFailure({
      kind: "mark-not-found",
      message: `The asset "${asset.id}" has no mark "${look.mark}".`,
      hint: `Its marks: ${(asset.marks ?? []).map((candidate) => candidate.name).join(", ") || "none"}. Add one with mark_asset.`,
    });
  }
  return {
    ok: true,
    value: {
      asset,
      kind: asset.kind,
      region: mark?.region ?? look.region,
      fromSeconds: look.from_seconds ?? mark?.seconds,
      toSeconds: look.to_seconds,
      count: look.count,
    },
  };
}
