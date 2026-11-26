import type { Snapshot } from "../../engine/snapshot.js";
import { assetNameOf } from "../../names/index.js";
import type { ShownItem } from "./shownItems.js";
import type { Take } from "./takeSchema.js";

export type ShownKind = "picture" | "clip" | "music" | "cut" | "story";

export function shownKindOf(shown: ShownItem): ShownKind {
  if (shown.item.kind !== "asset") return shown.item.kind;
  if (shown.asset?.kind === "video") return "clip";
  if (shown.asset?.kind === "audio") return "music";
  return "picture";
}

export function isMoving(kind: ShownKind): boolean {
  return kind === "clip" || kind === "music" || kind === "cut";
}

export function captionOf(shown: ShownItem): string {
  if (shown.item.kind === "cut") return "The cut";
  if (shown.item.kind === "story") return "The story";
  return shown.asset === undefined ? shown.item.id : assetNameOf(shown.asset);
}

function designChecksOf(snapshot: Snapshot) {
  const shots = (snapshot.bible.storyPlan?.shots ?? []).flatMap(
    (shot) => shot.designChecks ?? [],
  );
  const sheets = snapshot.bible.cast.flatMap((member) =>
    (member.looks ?? []).flatMap((look) =>
      look.sheets.flatMap((sheet) =>
        sheet.check === undefined ? [] : [sheet.check],
      ),
    ),
  );
  return [...shots, ...sheets];
}

export function faultOf(options: {
  shown: ShownItem;
  snapshot: Snapshot;
}): string | undefined {
  const failed = designChecksOf(options.snapshot)
    .filter(
      (check) =>
        check.assetId === options.shown.item.id &&
        check.breaks.length > 0 &&
        check.personKept === undefined,
    )
    .at(-1);
  if (failed === undefined) return undefined;
  return `The design check found a change: ${failed.breaks.join("; ")}`;
}

export function takeNumberOfAsset(options: {
  takes: readonly Take[];
  assetId: string;
}): number | undefined {
  return options.takes.find((take) =>
    take.items.some((item) => item.id === options.assetId),
  )?.number;
}

export function replacedIdOf(shown: ShownItem): string | undefined {
  return shown.item.kind === "asset" ? shown.item.replaces : undefined;
}

export function whatToCheckOf(shown: ShownItem): string | undefined {
  return shown.item.kind === "story" ? undefined : shown.item.whatToCheck;
}
