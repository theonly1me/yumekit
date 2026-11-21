import type { Edit, ProjectSnapshot, Timeline } from "@yumekit/project";
import type { HarnessFailure, Outcome } from "../results.js";
import { videoSoundTrackId } from "./narrationPlan.js";

export interface PlacementFrames {
  startFrame: number;
  durationFrames: number;
  removeEdits: Edit[];
  remainingTimeline: Timeline;
}

function withoutClips(options: { timeline: Timeline; clipIds: string[] }) {
  return {
    ...options.timeline,
    tracks: options.timeline.tracks.map((track) =>
      track.kind === "scene"
        ? {
            ...track,
            clips: track.clips.filter(
              (clip) => !options.clipIds.includes(clip.id),
            ),
          }
        : {
            ...track,
            clips: track.clips.filter(
              (clip) => !options.clipIds.includes(clip.id),
            ),
          },
    ),
  };
}

function replacedClipOf(options: { timeline: Timeline; clipId: string }) {
  for (const track of options.timeline.tracks) {
    if (track.kind !== "scene") continue;
    const clip = track.clips.find((each) => each.id === options.clipId);
    if (clip !== undefined) return clip;
  }
  return undefined;
}

function videoAssetIdOf(options: {
  snapshot: ProjectSnapshot;
  sceneId: string;
}): string | undefined {
  const scene = options.snapshot.scenes.find(
    (candidate) => candidate.id === options.sceneId,
  );
  if (scene?.source.kind !== "kit") return undefined;
  if (scene.source.component !== "video-clip") return undefined;
  const assetId = scene.source.props["assetId"];
  return typeof assetId === "string" ? assetId : undefined;
}

function soundClipIdsOf(options: {
  timeline: Timeline;
  assetId: string | undefined;
  startFrame: number;
}): string[] {
  const track = options.timeline.tracks.find(
    (candidate) => candidate.id === videoSoundTrackId,
  );
  if (track?.kind !== "audio" || options.assetId === undefined) return [];
  return track.clips
    .filter(
      (clip) =>
        clip.assetId === options.assetId &&
        clip.startFrame === options.startFrame,
    )
    .map((clip) => clip.id);
}

function sceneClipIds(timeline: Timeline): string {
  const ids = timeline.tracks.flatMap((track) =>
    track.kind === "scene" ? track.clips.map((clip) => clip.id) : [],
  );
  return ids.length === 0 ? "none" : ids.join(", ");
}

export function placementFramesOf(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
  assetLength: number;
  startFrame: number | undefined;
  durationFrames: number | undefined;
  replaceClipId: string | undefined;
}): Outcome<PlacementFrames, HarnessFailure> {
  const { timeline, replaceClipId } = options;
  if (replaceClipId === undefined) {
    if (options.startFrame === undefined) {
      return {
        ok: false,
        failure: {
          kind: "invalid-input",
          message: "place_video needs start_frame or replace_clip_id.",
          hint: "Give start_frame, or give replace_clip_id to put the video in place of a scene clip.",
        },
      };
    }
    return {
      ok: true,
      value: {
        startFrame: options.startFrame,
        durationFrames: options.durationFrames ?? options.assetLength,
        removeEdits: [],
        remainingTimeline: timeline,
      },
    };
  }
  const replaced = replacedClipOf({ timeline, clipId: replaceClipId });
  if (replaced === undefined) {
    return {
      ok: false,
      failure: {
        kind: "clip-not-found",
        message: `The output "${timeline.outputId}" has no scene clip "${replaceClipId}".`,
        hint: `Use one of these scene clip ids: ${sceneClipIds(timeline)}. Call get_timeline to see each clip.`,
      },
    };
  }
  const clipIds = [
    replaceClipId,
    ...soundClipIdsOf({
      timeline,
      assetId: videoAssetIdOf({
        snapshot: options.snapshot,
        sceneId: replaced.sceneId,
      }),
      startFrame: replaced.startFrame,
    }),
  ];
  return {
    ok: true,
    value: {
      startFrame: options.startFrame ?? replaced.startFrame,
      durationFrames: options.durationFrames ?? replaced.durationFrames,
      remainingTimeline: withoutClips({ timeline, clipIds }),
      removeEdits: clipIds.map((clipId): Edit => ({
        kind: "removeClip",
        outputId: timeline.outputId,
        clipId,
      })),
    },
  };
}
