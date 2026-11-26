import type { Take } from "../format/takes.js";
import { sentTakesOf } from "./verdicts.js";

export interface PlaceAsset {
  id: string;
  kind: string;
  shotId: string | undefined;
}

export interface PlaceSheet {
  assetId: string;
  castId: string;
  lookId: string;
  sheetKind: string;
}

export interface PlaceFacts {
  assets: ReadonlyMap<string, PlaceAsset>;
  sheets: readonly PlaceSheet[];
  takes: readonly Take[];
}

export type Place =
  | { kind: "shot-picture"; shotId: string }
  | { kind: "shot-clip"; shotId: string }
  | { kind: "sheet"; castId: string; lookId: string; sheetKind: string }
  | { kind: "music" }
  | { kind: "versions"; firstId: string };

export function placeKeyOf(place: Place): string {
  switch (place.kind) {
    case "shot-picture":
    case "shot-clip":
      return `${place.kind}:${place.shotId}`;
    case "sheet":
      return `sheet:${place.castId}:${place.lookId}:${place.sheetKind}`;
    case "music":
      return "music";
    case "versions":
      return `versions:${place.firstId}`;
  }
}

function replacedIdsOf(takes: readonly Take[]): Map<string, string> {
  const replaced = new Map<string, string>();
  for (const take of takes) {
    for (const item of take.items) {
      if (item.kind === "asset" && item.replaces !== undefined) {
        replaced.set(item.id, item.replaces);
      }
    }
  }
  return replaced;
}

function ownPlaceOf(options: {
  facts: PlaceFacts;
  asset: PlaceAsset;
}): Place | undefined {
  const { asset } = options;
  const sheet = options.facts.sheets.find(
    (candidate) => candidate.assetId === asset.id,
  );
  if (sheet !== undefined) return { kind: "sheet", ...sheet };
  if (asset.shotId !== undefined && asset.kind === "image") {
    return { kind: "shot-picture", shotId: asset.shotId };
  }
  if (asset.shotId !== undefined && asset.kind === "video") {
    return { kind: "shot-clip", shotId: asset.shotId };
  }
  return asset.kind === "audio" ? { kind: "music" } : undefined;
}

export function placeOf(options: {
  facts: PlaceFacts;
  assetId: string;
}): Place | undefined {
  const replaced = replacedIdsOf(options.facts.takes);
  const seen = new Set<string>();
  let assetId = options.assetId;
  for (;;) {
    const asset = options.facts.assets.get(assetId);
    if (asset === undefined) return undefined;
    const own = ownPlaceOf({ facts: options.facts, asset });
    if (own !== undefined) return own;
    seen.add(assetId);
    const older = replaced.get(assetId);
    if (older === undefined || seen.has(older)) {
      return { kind: "versions", firstId: assetId };
    }
    assetId = older;
  }
}

export function personPicksOf(takes: readonly Take[]): string[] {
  return sentTakesOf(takes).flatMap((take) =>
    take.notes.filter((note) => note.use === true).map((note) => note.itemId),
  );
}

export function inUseByPlaceOf(options: {
  facts: PlaceFacts;
  usedIds: ReadonlySet<string>;
  draftDefaults?: readonly string[];
  draftPicks?: readonly string[];
}): Map<string, string> {
  const { facts } = options;
  const inUse = new Map<string, string>();
  const set = (assetId: string) => {
    const place = placeOf({ facts, assetId });
    if (place !== undefined) inUse.set(placeKeyOf(place), assetId);
  };
  for (const assetId of options.usedIds) set(assetId);
  for (const take of sentTakesOf(facts.takes)) {
    for (const item of take.items) {
      if (item.kind === "asset" && item.approved === true) set(item.id);
    }
    for (const note of take.notes) {
      if (note.use === true) set(note.itemId);
    }
  }
  for (const assetId of options.draftDefaults ?? []) set(assetId);
  for (const assetId of options.draftPicks ?? []) set(assetId);
  return inUse;
}
