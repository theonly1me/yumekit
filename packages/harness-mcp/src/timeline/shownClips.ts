import type { Edit, ProjectSnapshot, Scene } from "@yumekit/project";
import type { HarnessFailure } from "../results.js";
import { shownClipFailureOf } from "../storyPlan/clipGate.js";

const videoComponent = "video-clip";

function scenesAfter(options: {
  snapshot: ProjectSnapshot;
  edits: Edit[];
}): Map<string, Scene> {
  const scenes = new Map(
    options.snapshot.scenes.map((scene) => [scene.id, scene]),
  );
  options.edits.forEach((edit) => {
    if (edit.kind === "putScene") scenes.set(edit.scene.id, edit.scene);
  });
  return scenes;
}

function videoAssetIdOf(scene: Scene | undefined): string | undefined {
  if (scene?.source.kind !== "kit") return undefined;
  if (scene.source.component !== videoComponent) return undefined;
  const assetId = scene.source.props["assetId"];
  return typeof assetId === "string" ? assetId : undefined;
}

export function shownClipsFailureOf(options: {
  snapshot: ProjectSnapshot;
  edits: Edit[];
}): HarnessFailure | undefined {
  const { snapshot, edits } = options;
  const scenes = scenesAfter(options);
  const sceneClips = edits.flatMap((edit) =>
    edit.kind === "setTimeline"
      ? edit.timeline.tracks.flatMap((track) =>
          track.kind === "scene" ? track.clips : [],
        )
      : [],
  );
  for (const clip of sceneClips) {
    const assetId = videoAssetIdOf(scenes.get(clip.sceneId));
    const asset = snapshot.assets.find((candidate) => candidate.id === assetId);
    if (asset === undefined) continue;
    const remaining = (asset.durationFrames ?? 0) - clip.sceneStartFrame;
    const failure = shownClipFailureOf({
      snapshot,
      asset,
      fromFrame: clip.sceneStartFrame,
      shownFrames: Math.max(0, Math.min(clip.durationFrames, remaining)),
    });
    if (failure !== undefined) return failure;
  }
  return undefined;
}
