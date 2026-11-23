import type { Asset, JsonObject } from "@yumekit/project";
import type { HarnessFailure } from "../results.js";

interface MarkUse {
  assetId: string;
  name: string;
}

function textOf(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function textsOf(value: unknown): (string | undefined)[] {
  return Array.isArray(value) ? value.map(textOf) : [];
}

function footageMarkUses(props: JsonObject): MarkUse[] {
  const assetId = textOf(props["assetId"]);
  if (assetId === undefined) return [];
  const stopMarks = Array.isArray(props["stops"])
    ? props["stops"].map((stop) =>
        typeof stop === "object" && stop !== null && !Array.isArray(stop)
          ? textOf(stop["mark"])
          : undefined,
      )
    : [];
  return [textOf(props["mark"]), ...stopMarks].flatMap((name) =>
    name === undefined ? [] : [{ assetId, name }],
  );
}

function lookSwapMarkUses(props: JsonObject): MarkUse[] {
  const assetIds = textsOf(props["assetIds"]);
  return textsOf(props["marks"]).flatMap((...[name, index]) => {
    const assetId = assetIds[index];
    return name === undefined || assetId === undefined
      ? []
      : [{ assetId, name }];
  });
}

function markUsesOf(options: { component: string; props: JsonObject }) {
  if (options.component === "footage") return footageMarkUses(options.props);
  if (options.component === "look-swap") return lookSwapMarkUses(options.props);
  return [];
}

function sameName(options: { left: string; right: string }): boolean {
  return (
    options.left.trim().toLowerCase() === options.right.trim().toLowerCase()
  );
}

export function checkKitMarks(options: {
  component: string;
  props: JsonObject;
  assets: readonly Asset[];
}): HarnessFailure | undefined {
  for (const use of markUsesOf(options)) {
    const asset = options.assets.find(
      (candidate) => candidate.id === use.assetId,
    );
    if (asset === undefined) continue;
    const marks = asset.marks ?? [];
    if (marks.some((mark) => sameName({ left: mark.name, right: use.name })))
      continue;
    return {
      kind: "mark-not-found",
      message: `The asset "${use.assetId}" has no mark "${use.name}". Its marks: ${marks.length === 0 ? "none" : marks.map((mark) => `"${mark.name}"`).join(", ")}.`,
      hint: `Add the mark with mark_asset, or give a region in place of the mark name. Call list_assets for the marks of each asset.`,
    };
  }
  return undefined;
}
