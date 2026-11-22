import { assetUsesOf, type AssetUse } from "@yumekit/project";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { findAsset } from "../lookups.js";
import { failureResult } from "../results.js";

function useText(use: AssetUse): string {
  switch (use.kind) {
    case "scene":
      return `scene "${use.sceneId}"`;
    case "audio-clip":
      return `clip "${use.clipId}" on track "${use.trackId}" of output "${use.outputId}"`;
    case "cast-member":
      return `cast member "${use.castId}"`;
  }
}

async function removeAsset(options: {
  context: HarnessContext;
  assetId: string;
}): Promise<CallToolResult> {
  const { context, assetId } = options;
  const snapshot = context.store.read();
  const found = findAsset({ snapshot, assetId });
  if (!found.ok) return failureResult(found.failure);
  const uses = assetUsesOf({
    project: { ...snapshot, cast: snapshot.bible.cast },
    assetId,
  });
  if (uses.length > 0) {
    return failureResult({
      kind: "asset-in-use",
      message: `The asset "${assetId}" is used by: ${uses.map(useText).join(", ")}.`,
      hint: "Change or remove each use that the message names first: put_scene for a scene, remove_clip or update_clip for a clip, set_bible for a cast member. Then call remove_asset again.",
    });
  }
  return applyEditsResult({
    store: context.store,
    edits: [{ kind: "removeAsset", assetId }],
    line: `Asset "${assetId}" removed from the project.`,
    data: { asset_id: assetId },
  });
}

export function registerRemoveAsset(context: HarnessContext): void {
  context.tools.add({
    name: "remove_asset",
    description:
      "Remove an asset that nothing uses from the list of assets. It fails with asset-in-use and names each scene, clip, and cast member that uses the asset. The media file stays in the project folder, so undo brings the asset back.",
    inputSchema: { asset_id: idInput("The id of the asset to remove.") },
    run: ({ input }) => removeAsset({ context, assetId: input.asset_id }),
  });
}
