import { join } from "node:path";
import {
  isCaptionTrack,
  scenesRowOf,
  type JsonObject,
  type ProjectSnapshot,
  type SceneClip,
  type Timeline,
} from "@yumekit/project";
import type { PageSceneSource } from "../page/stagePageData.js";

export const frameSceneId = "_frame";

export interface FrameLayer {
  props: JsonObject;
  source: PageSceneSource;
  sceneTracks: SceneClip[][];
}

function framePropsOf(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
}): JsonObject {
  const { snapshot, timeline } = options;
  const row = scenesRowOf({ tracks: timeline.tracks, scenes: snapshot.scenes });
  return {
    scenes: [...(row?.clips ?? []).entries()].map(([index, clip]) => ({
      index,
      sceneId: clip.sceneId,
      title:
        snapshot.scenes.find((scene) => scene.id === clip.sceneId)?.title ?? "",
      startFrame: clip.startFrame,
      durationFrames: clip.durationFrames,
    })),
  };
}

function frameIndexOf(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
}): number {
  const sceneTracks = options.timeline.tracks.filter(
    (track) => track.kind === "scene",
  );
  const firstCaption = sceneTracks.findIndex((track) =>
    isCaptionTrack({ track, scenes: options.snapshot.scenes }),
  );
  return firstCaption < 0 ? sceneTracks.length : firstCaption;
}

export function frameLayerOf(options: {
  folder: string;
  snapshot: ProjectSnapshot;
  timeline: Timeline;
  frameCount: number;
}): FrameLayer | undefined {
  const { folder, snapshot, timeline, frameCount } = options;
  const name = snapshot.project.frame;
  const sceneTracks = timeline.tracks.flatMap((track) =>
    track.kind === "scene" ? [track.clips] : [],
  );
  if (name === undefined || frameCount <= 0) return undefined;
  const frameClip: SceneClip = {
    id: frameSceneId,
    sceneId: frameSceneId,
    startFrame: 0,
    durationFrames: frameCount,
    sceneStartFrame: 0,
  };
  const index = frameIndexOf({ snapshot, timeline });
  return {
    props: framePropsOf({ snapshot, timeline }),
    source: {
      kind: "module",
      file: join(folder, "scenes", "_shared", `${name}.tsx`),
    },
    sceneTracks: [
      ...sceneTracks.slice(0, index),
      [frameClip],
      ...sceneTracks.slice(index),
    ],
  };
}
