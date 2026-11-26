import {
  inUseByPlaceOf,
  placeKeyOf,
  placeOf,
  type PlaceFacts,
} from "@yumekit/project/takes";
import type { Snapshot } from "../../../engine/snapshot.js";
import { assetUsesIn } from "../../../parts/files/fileUses.js";
import { shotIdOf } from "../planOrder.js";

export function placeFactsOf(snapshot: Snapshot): PlaceFacts {
  return {
    assets: new Map(
      snapshot.assets.map((asset) => [
        asset.id,
        { id: asset.id, kind: asset.kind, shotId: shotIdOf(asset) },
      ]),
    ),
    sheets: snapshot.bible.cast.flatMap((member) =>
      (member.looks ?? []).flatMap((look) =>
        look.sheets.map((sheet) => ({
          assetId: sheet.assetId,
          castId: member.id,
          lookId: look.id,
          sheetKind: sheet.kind,
        })),
      ),
    ),
    takes: snapshot.takes ?? [],
  };
}

function shownSceneIdsOf(snapshot: Snapshot): Set<string> {
  return new Set(
    snapshot.timelines.flatMap((timeline) =>
      timeline.tracks.flatMap((track) =>
        track.kind === "scene" ? track.clips.map((clip) => clip.sceneId) : [],
      ),
    ),
  );
}

function filmUsesOf(snapshot: Snapshot): Set<string> {
  const shownScenes = shownSceneIdsOf(snapshot);
  return new Set(
    snapshot.assets
      .filter((asset) =>
        assetUsesIn({ snapshot, assetId: asset.id }).some((use) =>
          use.kind === "scene" ? shownScenes.has(use.sceneId) : true,
        ),
      )
      .map((asset) => asset.id),
  );
}

export interface PlaceUses {
  inUseIds: ReadonlySet<string>;
  placeKeyOfItem: (itemId: string) => string | undefined;
}

export function placeUsesOf(options: {
  snapshot: Snapshot;
  draftPicks: readonly string[];
}): PlaceUses {
  const facts = placeFactsOf(options.snapshot);
  const inUse = inUseByPlaceOf({
    facts,
    usedIds: filmUsesOf(options.snapshot),
    draftPicks: options.draftPicks,
  });
  return {
    inUseIds: new Set(inUse.values()),
    placeKeyOfItem: (itemId) => {
      const place = placeOf({ facts, assetId: itemId });
      return place === undefined ? undefined : placeKeyOf(place);
    },
  };
}
