import type { AudioClip, Timeline, Track } from "../../engine/snapshot.js";

export interface PlannedClip {
  startFrame: number;
  durationFrames: number;
}

export function lengthWithoutTrack(options: {
  timeline: Timeline;
  trackId: string | undefined;
}): number {
  const ends = options.timeline.tracks
    .filter((track) => track.id !== options.trackId)
    .flatMap((track) =>
      track.clips.map((clip) => clip.startFrame + clip.durationFrames),
    );
  return Math.max(0, ...ends);
}

export function repeatedClipsOf(options: {
  assetFrames: number;
  videoFrames: number;
}): PlannedClip[] {
  const { assetFrames, videoFrames } = options;
  if (assetFrames <= 0 || videoFrames <= 0) return [];
  const count = Math.ceil(videoFrames / assetFrames);
  return Array.from({ length: count }, (...[, index]) => ({
    startFrame: index * assetFrames,
    durationFrames: Math.min(assetFrames, videoFrames - index * assetFrames),
  }));
}

function wireClipOf(clip: AudioClip) {
  return {
    id: clip.id,
    asset_id: clip.assetId,
    start_frame: clip.startFrame,
    duration_frames: clip.durationFrames,
    asset_start_frame: clip.assetStartFrame,
    gain_decibels: clip.gainDecibels,
  };
}

function wireTrackOf(track: Track) {
  const off = track.off === true;
  return track.kind === "scene"
    ? {
        id: track.id,
        kind: track.kind,
        off,
        clips: track.clips.map((clip) => ({
          id: clip.id,
          scene_id: clip.sceneId,
          start_frame: clip.startFrame,
          duration_frames: clip.durationFrames,
          scene_start_frame: clip.sceneStartFrame,
        })),
      }
    : {
        id: track.id,
        kind: track.kind,
        off,
        clips: track.clips.map(wireClipOf),
      };
}

export function timelineWithSound(options: {
  timeline: Timeline;
  trackId: string;
  assetId: string;
  clips: PlannedClip[];
  gainDecibels: number;
}) {
  const { timeline, trackId } = options;
  const soundClips = options.clips.map((...[clip, index]) =>
    wireClipOf({
      id: `${trackId.slice(0, 20)}-${options.assetId.slice(0, 32)}-${String(index + 1)}`,
      assetId: options.assetId,
      startFrame: clip.startFrame,
      durationFrames: clip.durationFrames,
      assetStartFrame: 0,
      gainDecibels: options.gainDecibels,
    }),
  );
  const hasTrack = timeline.tracks.some((track) => track.id === trackId);
  const tracks = timeline.tracks.map((track) =>
    track.id === trackId
      ? { ...wireTrackOf(track), clips: soundClips }
      : wireTrackOf(track),
  );
  return {
    output_id: timeline.outputId,
    tracks: hasTrack
      ? tracks
      : [
          ...tracks,
          { id: trackId, kind: "audio", off: false, clips: soundClips },
        ],
  };
}
