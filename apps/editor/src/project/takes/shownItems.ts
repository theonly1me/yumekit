import type { Asset, Snapshot } from "../../engine/snapshot.js";
import type { Take, TakeItem } from "./takeSchema.js";
import { takesOfStep, verdictsOf, type Verdict } from "./verdicts.js";

export type SectionId =
  "cut" | "clips" | "music" | "cast" | "shots" | "pictures";

export const sectionNames: Record<SectionId, string> = {
  cut: "The cut",
  clips: "Clips",
  music: "Music",
  cast: "Characters and their looks",
  shots: "Shots",
  pictures: "Pictures",
};

const sectionOrder: SectionId[] = [
  "cut",
  "clips",
  "music",
  "cast",
  "shots",
  "pictures",
];

export interface ShownItem {
  item: TakeItem;
  asset: Asset | undefined;
  takeNumber: number;
  isNew: boolean;
  verdict: Verdict | undefined;
  section: SectionId;
}

function castSheetIdsOf(snapshot: Snapshot): Set<string> {
  return new Set(
    snapshot.bible.cast.flatMap((member) =>
      (member.looks ?? []).flatMap((look) =>
        look.sheets.map((sheet) => sheet.assetId),
      ),
    ),
  );
}

function sectionOf(options: {
  item: TakeItem;
  asset: Asset | undefined;
  castSheetIds: Set<string>;
}): SectionId {
  const { item, asset } = options;
  if (item.kind !== "asset") return "cut";
  if (asset?.kind === "video") return "clips";
  if (asset?.kind === "audio") return "music";
  if (options.castSheetIds.has(item.id)) return "cast";
  const shotId =
    asset?.source.kind === "tool" ? asset.source.input["shot_id"] : undefined;
  return typeof shotId === "string" ? "shots" : "pictures";
}

function earlierApproved(options: {
  takes: readonly Take[];
  take: Take;
  verdicts: Map<string, Verdict>;
}): { item: TakeItem; takeNumber: number }[] {
  const { take } = options;
  const ownIds = new Set(take.items.map((item) => item.id));
  const replaced = new Set(
    take.items.flatMap((item) =>
      item.kind === "asset" && item.replaces !== undefined
        ? [item.replaces]
        : [],
    ),
  );
  const seen = new Set<string>();
  return takesOfStep({ ...options, chapterId: take.chapterId, step: take.step })
    .filter((earlier) => earlier.number < take.number)
    .toReversed()
    .flatMap((earlier) =>
      earlier.items
        .filter((item) => {
          const isShown =
            !ownIds.has(item.id) &&
            !replaced.has(item.id) &&
            !seen.has(item.id) &&
            options.verdicts.get(item.id) === "approved";
          seen.add(item.id);
          return isShown;
        })
        .map((item) => ({ item, takeNumber: earlier.number })),
    );
}

export function shownItemsOf(options: {
  snapshot: Snapshot;
  take: Take;
  withEarlier: boolean;
}): ShownItem[] {
  const { snapshot, take } = options;
  const takes = snapshot.takes ?? [];
  const verdicts = verdictsOf(takes);
  const castSheetIds = castSheetIdsOf(snapshot);
  const own = take.items.map((item) => ({ item, takeNumber: take.number }));
  const earlier = options.withEarlier
    ? earlierApproved({ takes, take, verdicts })
    : [];
  const shown = [...own, ...earlier].map(({ item, takeNumber }) => {
    const asset = snapshot.assets.find((each) => each.id === item.id);
    return {
      item,
      asset,
      takeNumber,
      isNew: takeNumber === take.number,
      verdict: verdicts.get(item.id),
      section: sectionOf({ item, asset, castSheetIds }),
    };
  });
  return sectionOrder.flatMap((section) =>
    shown.filter((each) => each.section === section),
  );
}
