import type { Asset, ProjectSnapshot, Shot } from "@yumekit/project";

export function shotIdOf(asset: Asset): string | undefined {
  if (asset.source.kind !== "tool") return undefined;
  const shotId = asset.source.input["shot_id"];
  return typeof shotId === "string" ? shotId : undefined;
}

export function shotOfAsset(options: {
  snapshot: ProjectSnapshot;
  asset: Asset;
}): Shot | undefined {
  const shotId = shotIdOf(options.asset);
  return options.snapshot.bible.storyPlan?.shots.find(
    (shot) => shot.id === shotId,
  );
}
