import { assetVerdictsOf, sentTakesOf } from "@yumekit/project/takes";
import type { Asset, Snapshot } from "../engine/snapshot.js";
import type { FilmChapters } from "../chapters/filmChapters.js";
import { assetNameOf } from "../names/index.js";

export interface TrayItem {
  assetId: string;
  kind: "picture" | "clip";
  name: string;
  takeNumber: number;
  shotId: string | undefined;
}

function shotIdOf(asset: Asset): string | undefined {
  if (asset.source.kind !== "tool") return undefined;
  const shotId = asset.source.input["shot_id"];
  return typeof shotId === "string" ? shotId : undefined;
}

export function trayItemsOf(snapshot: Snapshot): TrayItem[] {
  const takes = snapshot.takes ?? [];
  const verdicts = assetVerdictsOf(takes);
  const items: TrayItem[] = [];
  for (const take of sentTakesOf(takes)) {
    for (const item of take.items) {
      const isNew = !items.some((each) => each.assetId === item.id);
      if (item.kind !== "asset" || !isNew) continue;
      if (verdicts.get(item.id) !== "approved") continue;
      const asset = snapshot.assets.find((each) => each.id === item.id);
      if (asset?.kind !== "image" && asset?.kind !== "video") continue;
      items.push({
        assetId: asset.id,
        kind: asset.kind === "video" ? "clip" : "picture",
        name: assetNameOf(asset),
        takeNumber: take.number,
        shotId: shotIdOf(asset),
      });
    }
  }
  return items;
}

export function placeCallOf(options: {
  item: TrayItem;
  outputId: string;
  clipId: string;
}): { name: string; input: object } {
  const { item } = options;
  return {
    name: item.kind === "clip" ? "place_video" : "place_picture",
    input: {
      output_id: options.outputId,
      asset_id: item.assetId,
      replace_clip_id: options.clipId,
      remove_person_work: true,
    },
  };
}

export function chapterRefusalOf(options: {
  item: TrayItem;
  clipId: string;
  film: FilmChapters;
}): string | undefined {
  const { item, film } = options;
  if (item.kind !== "clip" || item.shotId === undefined || !film.isSplit) {
    return undefined;
  }
  const { shotId } = item;
  const home = film.chapters.find((chapter) =>
    chapter.shotIds.includes(shotId),
  );
  const target = film.cards.find((card) => card.clip.id === options.clipId);
  if (home === undefined || target?.chapterId === home.id) return undefined;
  return `This clip belongs to chapter ${String(home.number)}, "${home.title}". Drop it on a scene of that chapter.`;
}
