import {
  assetUsesOf,
  inUseByPlaceOf,
  personPicksOf,
  placeKeyOf,
  placeOf,
  type Place,
  type PlaceFacts,
  type ProjectSnapshot,
  type Take,
} from "@yumekit/project";
import { shotIdOf } from "../storyPlan/shotOfAsset.js";
import { sourceTextOf } from "../storyPlan/tryRules.js";

const assetWords = { image: "picture", video: "clip", audio: "music" } as const;

export function placeFactsOf(options: {
  snapshot: ProjectSnapshot;
  takes: readonly Take[];
}): PlaceFacts {
  const { snapshot } = options;
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
    takes: options.takes,
  };
}

function usedIdsOf(snapshot: ProjectSnapshot): Set<string> {
  const project = {
    scenes: snapshot.scenes,
    timelines: snapshot.timelines,
    cast: snapshot.bible.cast,
  };
  return new Set(
    snapshot.assets
      .filter((asset) => assetUsesOf({ project, assetId: asset.id }).length > 0)
      .map((asset) => asset.id),
  );
}

function placeWordsOf(place: Place): string {
  switch (place.kind) {
    case "shot-picture":
      return `as the start picture of shot "${place.shotId}"`;
    case "shot-clip":
      return `as the clip of shot "${place.shotId}"`;
    case "sheet":
      return `as the ${place.sheetKind} sheet of "${place.castId}" in the look "${place.lookId}"`;
    case "music":
      return "as the music";
    case "versions":
      return "over its other versions";
  }
}

function wordOf(options: { snapshot: ProjectSnapshot; assetId: string }) {
  const asset = options.snapshot.assets.find(
    (candidate) => candidate.id === options.assetId,
  );
  return asset === undefined || asset.kind === "font"
    ? "item"
    : assetWords[asset.kind];
}

export function pickLinesOf(options: {
  snapshot: ProjectSnapshot;
  take: Take;
}): string[] {
  const { snapshot, take } = options;
  const before = placeFactsOf({
    snapshot,
    takes: snapshot.takes.filter((each) => each.id !== take.id),
  });
  const inUse = inUseByPlaceOf({ facts: before, usedIds: usedIdsOf(snapshot) });
  const facts = placeFactsOf({ snapshot, takes: snapshot.takes });
  return personPicksOf([take]).flatMap((assetId) => {
    const place = placeOf({ facts, assetId });
    if (place === undefined) return [];
    const key = placeKeyOf(place);
    const earlier = inUse.get(key);
    const others = [...facts.assets.keys()].filter((otherId) => {
      const otherPlace = placeOf({ facts, assetId: otherId });
      return (
        otherId !== assetId &&
        otherPlace !== undefined &&
        placeKeyOf(otherPlace) === key
      );
    });
    const instead =
      earlier !== undefined && earlier !== assetId
        ? `, in place of "${earlier}"`
        : others.length > 0
          ? `, in place of ${others.map((id) => `"${id}"`).join(" and ")}`
          : "";
    return [
      `Use the ${wordOf({ snapshot, assetId })} "${assetId}" ${placeWordsOf(place)}${instead}.`,
    ];
  });
}

function isPlaced(options: {
  snapshot: ProjectSnapshot;
  assetId: string;
  place: Place;
}): boolean {
  const { snapshot, assetId, place } = options;
  if (place.kind === "shot-picture") {
    return snapshot.assets.some(
      (asset) =>
        sourceTextOf({ asset, field: "first_frame_asset_id" }) === assetId,
    );
  }
  return usedIdsOf(snapshot).has(assetId);
}

export function waitingPickLinesOf(snapshot: ProjectSnapshot): string[] {
  const facts = placeFactsOf({ snapshot, takes: snapshot.takes });
  const latest = new Map<string, { assetId: string; place: Place }>();
  for (const assetId of personPicksOf(snapshot.takes)) {
    const place = placeOf({ facts, assetId });
    if (place !== undefined) latest.set(placeKeyOf(place), { assetId, place });
  }
  const waiting = [...latest.values()].filter(
    (pick) => !isPlaced({ snapshot, ...pick }),
  );
  if (waiting.length === 0) return [];
  return [
    "Picks of the person that wait for you: put each into the film as it is, and remake nothing for its place.",
    ...waiting.map(
      (pick) =>
        `- Use the ${wordOf({ snapshot, assetId: pick.assetId })} "${pick.assetId}" ${placeWordsOf(pick.place)}.`,
    ),
  ];
}
