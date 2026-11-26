import type { Asset, Snapshot } from "../../engine/snapshot.js";

const unplanned = Number.MAX_SAFE_INTEGER;

function placeOf(options: { index: number }): number {
  return options.index === -1 ? unplanned : options.index;
}

function shotIdOf(asset: Asset | undefined): string | undefined {
  if (asset?.source.kind !== "tool") return undefined;
  const shotId = asset.source.input["shot_id"];
  return typeof shotId === "string" ? shotId : undefined;
}

export function planPlaceOf(options: {
  snapshot: Snapshot;
  asset: Asset | undefined;
}): [number, number] {
  const { snapshot, asset } = options;
  const shotId = shotIdOf(asset);
  const shots = snapshot.bible.storyPlan?.shots ?? [];
  const cast = snapshot.bible.cast.findIndex((member) =>
    (member.looks ?? []).some((look) =>
      look.sheets.some((sheet) => sheet.assetId === asset?.id),
    ),
  );
  return [
    placeOf({ index: shots.findIndex((shot) => shot.id === shotId) }),
    placeOf({ index: cast }),
  ];
}

export function inPlanOrder<
  Shown extends { asset: Asset | undefined },
>(options: { snapshot: Snapshot; items: Shown[] }): Shown[] {
  const places = new Map(
    options.items.map((shown) => [
      shown,
      planPlaceOf({ snapshot: options.snapshot, asset: shown.asset }),
    ]),
  );
  return options.items.toSorted((...[first, second]) => {
    const [firstShot = 0, firstCast = 0] = places.get(first) ?? [];
    const [secondShot = 0, secondCast = 0] = places.get(second) ?? [];
    return firstShot - secondShot || firstCast - secondCast;
  });
}
