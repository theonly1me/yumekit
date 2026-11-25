import type { Asset } from "@yumekit/project";

export function sourceTextOf(options: {
  asset: Asset;
  field: string;
}): string | undefined {
  const { asset } = options;
  if (asset.source.kind !== "tool") return undefined;
  const value = asset.source.input[options.field];
  return typeof value === "string" ? value : undefined;
}

export function sourceIdsOf(options: {
  asset: Asset | undefined;
  field: string;
}): string[] {
  const { asset } = options;
  if (asset?.source.kind !== "tool") return [];
  const value = asset.source.input[options.field];
  return Array.isArray(value)
    ? value.filter((entry) => typeof entry === "string")
    : [];
}
