import type { Edit, Timeline, Track } from "@yumekit/project";
import { uniqueId } from "./narrationPlan.js";
import { isSoundsTrack, soundsTrackId } from "./soundsTrack.js";

export function scenesEndFrameOf(timeline: Timeline): number {
  return Math.max(
    0,
    ...timeline.tracks
      .filter((track) => track.kind === "scene")
      .flatMap((track) =>
        track.clips.map((clip) => clip.startFrame + clip.durationFrames),
      ),
  );
}

function isFree(options: {
  track: Track;
  startFrame: number;
  durationFrames: number;
}): boolean {
  const end = options.startFrame + options.durationFrames;
  return options.track.clips.every(
    (clip) =>
      clip.startFrame >= end ||
      clip.startFrame + clip.durationFrames <= options.startFrame,
  );
}

export interface SoundPlan {
  edits: Edit[];
  trackId: string;
  clipId: string;
}

export function planSound(options: {
  timeline: Timeline;
  assetId: string;
  startFrame: number;
  durationFrames: number;
  gainDecibels: number;
}): SoundPlan {
  const { timeline, startFrame, durationFrames } = options;
  const trackIds = timeline.tracks.map((track) => track.id);
  const freeTrack = timeline.tracks.find(
    (track) =>
      isSoundsTrack(track) && isFree({ track, startFrame, durationFrames }),
  );
  const trackId =
    freeTrack?.id ?? uniqueId({ base: soundsTrackId, taken: trackIds });
  const clipId = uniqueId({
    base: `sound-${options.assetId}`,
    taken: timeline.tracks.flatMap((track) =>
      track.clips.map((clip) => clip.id),
    ),
  });
  const newTrackEdit: Edit[] =
    freeTrack === undefined
      ? [
          {
            kind: "setTimeline",
            timeline: {
              outputId: timeline.outputId,
              tracks: [
                ...timeline.tracks,
                { id: trackId, kind: "audio", clips: [] },
              ],
            },
          },
        ]
      : [];
  return {
    trackId,
    clipId,
    edits: [
      ...newTrackEdit,
      {
        kind: "addClip",
        outputId: timeline.outputId,
        trackId,
        clip: {
          id: clipId,
          assetId: options.assetId,
          startFrame,
          durationFrames,
          assetStartFrame: 0,
          gainDecibels: options.gainDecibels,
        },
      },
    ],
  };
}
