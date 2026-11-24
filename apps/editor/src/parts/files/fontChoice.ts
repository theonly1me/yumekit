import type { Snapshot } from "../../engine/snapshot.js";

const fallbackFamily = "Own font";
const variableWeights: [number, number] = [100, 900];

export function fontFamilyOf(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, "");
  const [first = ""] = stem.split(/[-_]/);
  const family = first
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);
  return /^[A-Za-z0-9]/.test(family) ? family : fallbackFamily;
}

export function fontWeightOf(fileName: string): [number, number] | undefined {
  return /variable/i.test(fileName) ? variableWeights : undefined;
}

export function lookFontInput(options: {
  snapshot: Snapshot;
  assetId: string;
  fileName: string;
}) {
  const family = fontFamilyOf(options.fileName);
  const weight = fontWeightOf(options.fileName);
  const kept = (options.snapshot.project.fonts ?? [])
    .filter((font) => font.assetId !== options.assetId)
    .map((font) => ({
      asset_id: font.assetId,
      family: font.family,
      ...(font.weight === undefined ? {} : { weight: font.weight }),
      ...(font.style === undefined ? {} : { style: font.style }),
    }));
  return {
    fonts: [
      ...kept,
      {
        asset_id: options.assetId,
        family,
        ...(weight === undefined ? {} : { weight }),
      },
    ],
    look_font: family,
  };
}
