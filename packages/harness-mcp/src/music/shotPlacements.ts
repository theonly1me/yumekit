import type { ProjectSnapshot } from "@yumekit/project";

export interface ShotPlacement {
  fromSeconds: number;
  toSeconds: number;
}

function shotIdOfScene(options: {
  snapshot: ProjectSnapshot;
  sceneId: string;
}): string | undefined {
  const { snapshot } = options;
  const scene = snapshot.scenes.find(
    (candidate) => candidate.id === options.sceneId,
  );
  if (scene?.source.kind !== "kit") return undefined;
  const assetId = scene.source.props["assetId"];
  const asset = snapshot.assets.find((candidate) => candidate.id === assetId);
  if (asset?.source.kind !== "tool") return undefined;
  const shotId = asset.source.input["shot_id"];
  return typeof shotId === "string" ? shotId : undefined;
}

export function shotPlacementsOf(
  snapshot: ProjectSnapshot,
): Map<string, ShotPlacement> {
  const placements = new Map<string, ShotPlacement>();
  const [timeline] = snapshot.timelines;
  const { framesPerSecond } = snapshot.project;
  for (const track of timeline?.tracks ?? []) {
    if (track.kind !== "scene") continue;
    for (const clip of track.clips) {
      const shotId = shotIdOfScene({ snapshot, sceneId: clip.sceneId });
      if (shotId === undefined || placements.has(shotId)) continue;
      placements.set(shotId, {
        fromSeconds: clip.startFrame / framesPerSecond,
        toSeconds: (clip.startFrame + clip.durationFrames) / framesPerSecond,
      });
    }
  }
  return placements;
}
