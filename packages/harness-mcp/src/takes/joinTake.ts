import type { Edit } from "@yumekit/project";
import { toolNameByCapability } from "../media/generateAssetInput.js";

export function joinTakeEdits(options: {
  assetId: string;
  tool: string | undefined;
}): Edit[] {
  if (options.tool === toolNameByCapability.speech) return [];
  return [
    { kind: "fillTake", items: [{ kind: "asset", id: options.assetId }] },
  ];
}
