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

function clipStartFrameOf(options: {
  scene: Scene | undefined;
  framesPerSecond: number;
}): number {
  if (options.scene?.source.kind !== "kit") return 0;
  const startSeconds = options.scene.source.props["startSeconds"];
  return typeof startSeconds === "number"
    ? Math.round(startSeconds * options.framesPerSecond)
    : 0;
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
    const scene = scenes.get(clip.sceneId);
    const assetId = videoAssetIdOf(scene);
    const asset = snapshot.assets.find((candidate) => candidate.id === assetId);
    if (asset === undefined) continue;
    const fromFrame =
      clipStartFrameOf({
        scene,
        framesPerSecond: snapshot.project.framesPerSecond,
      }) + clip.sceneStartFrame;
    const remaining = (asset.durationFrames ?? 0) - fromFrame;
    const failure = shownClipFailureOf({
      snapshot,
      asset,
      fromFrame,
      shownFrames: Math.max(0, Math.min(clip.durationFrames, remaining)),
    });
    if (failure !== undefined) return failure;
  }
  return undefined;
}
