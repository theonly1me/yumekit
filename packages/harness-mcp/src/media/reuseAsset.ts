import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Asset } from "@yumekit/project";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { successResult } from "../results.js";

export function summaryOf(options: {
  asset: Pick<Asset, "id" | "kind" | "file" | "durationFrames" | "hasWords">;
  reused: boolean;
}) {
  const { asset } = options;
  return {
    asset_id: asset.id,
    kind: asset.kind,
    file: asset.file,
    ...(asset.durationFrames === undefined
      ? {}
      : { duration_frames: asset.durationFrames }),
    has_words: asset.hasWords,
    reused: options.reused,
  };
}

export async function reuseAsset(options: {
  context: HarnessContext;
  existing: Asset;
  assetId: string;
}): Promise<CallToolResult> {
  const { context, existing, assetId } = options;
  if (existing.id === assetId) {
    return successResult({
      line: `Asset "${assetId}" already has this source. No new call to the media tool.`,
      data: summaryOf({ asset: existing, reused: true }),
    });
  }
  const words = await context.store.readAssetWords(existing.id);
  return applyEditsResult({
    store: context.store,
    edits: [
      {
        kind: "addAsset",
        asset: {
          id: assetId,
          kind: existing.kind,
          file: existing.file,
          source: existing.source,
          ...(existing.widthPixels === undefined
            ? {}
            : { widthPixels: existing.widthPixels }),
          ...(existing.heightPixels === undefined
            ? {}
            : { heightPixels: existing.heightPixels }),
          ...(existing.durationFrames === undefined
            ? {}
            : { durationFrames: existing.durationFrames }),
        },
        ...(words.ok ? { words: words.value } : {}),
      },
    ],
    line: `Asset "${assetId}" reuses the file of "${existing.id}", which has the same source. No new call to the media tool.`,
    data: summaryOf({ asset: { ...existing, id: assetId }, reused: true }),
  });
}
