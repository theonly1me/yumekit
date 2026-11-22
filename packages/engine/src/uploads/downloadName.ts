import { extname } from "node:path";
import type { Asset } from "@yumekit/project";

function nameOf(asset: Asset): string {
  return asset.source.kind === "import"
    ? asset.source.originalName
    : `${asset.id}${extname(asset.file)}`;
}

export function downloadDispositionOf(asset: Asset): string {
  const name = nameOf(asset);
  const plainName = name.replace(/[^A-Za-z0-9._-]/g, "_");
  return `attachment; filename="${plainName}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
