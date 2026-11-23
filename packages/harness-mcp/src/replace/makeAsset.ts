import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Asset } from "@yumekit/project";
import type { HarnessContext } from "../context.js";
import type { ProgressListener } from "../harness/toolTable.js";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import { generateAsset } from "../media/registerGenerateAsset.js";
import { failureResult } from "../results.js";

export type MadeAsset =
  | { ok: true; asset: Asset & { durationFrames: number } }
  | { ok: false; result: CallToolResult };

export async function makeAsset(options: {
  context: HarnessContext;
  request: GenerateAssetInput;
  onProgress: ProgressListener | undefined;
}): Promise<MadeAsset> {
  const made = await generateAsset(options);
  if (made.isError === true) return { ok: false, result: made };
  return assetOf({
    context: options.context,
    assetId: made.structuredContent?.["asset_id"],
  });
}

export function assetOf(options: {
  context: HarnessContext;
  assetId: unknown;
}): MadeAsset {
  const asset = options.context.store
    .read()
    .assets.find((candidate) => candidate.id === options.assetId);
  if (asset?.kind !== "audio" || asset.durationFrames === undefined) {
    return {
      ok: false,
      result: failureResult({
        kind: "asset-not-audio",
        message: `The asset "${String(options.assetId)}" is not a sound with a length.`,
        hint: "Call list_assets, and give the id of an audio asset.",
      }),
    };
  }
  return {
    ok: true,
    asset: { ...asset, durationFrames: asset.durationFrames },
  };
}
