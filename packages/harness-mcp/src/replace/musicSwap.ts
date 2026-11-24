import type { Asset, AudioClip, Timeline, Track } from "@yumekit/project";
import { uniqueId } from "../timeline/narrationPlan.js";
import { lengthWithout, musicTrackOf } from "./soundRoles.js";

const musicGainUnderVoice = -12;

export function musicLengthOf(options: {
  timeline: Timeline;
  assets: Asset[];
}): number {
  const music = musicTrackOf(options);
  return lengthWithout({
    timeline: options.timeline,
    trackIds: music === undefined ? [] : [music.id],
  });
}

function repeatedClipsOf(options: {
  asset: Asset & { durationFrames: number };
  videoFrames: number;
  gainDecibels: number;
  takenIds: string[];
  assetStartFrame: number;
}): AudioClip[] {
  const { asset, videoFrames } = options;
  const clips: AudioClip[] = [];
  const firstStart = Math.min(
    options.assetStartFrame,
    Math.max(0, asset.durationFrames - 1),
  );
  for (let startFrame = 0; startFrame < videoFrames;) {
    const assetStartFrame = clips.length === 0 ? firstStart : 0;
    const length = asset.durationFrames - assetStartFrame;
    clips.push({
      id: uniqueId({
        base: `music-${asset.id}`,
        taken: [...options.takenIds, ...clips.map((clip) => clip.id)],
      }),
      assetId: asset.id,
      startFrame,
      durationFrames: Math.min(length, videoFrames - startFrame),
      assetStartFrame,
      gainDecibels: options.gainDecibels,
    });
    startFrame += length;
  }
  return clips;
}

export function musicSwapOf(options: {
  timeline: Timeline;
  assets: Asset[];
  asset: Asset & { durationFrames: number };
  gainDecibels: number | undefined;
  assetStartFrame?: number;
}): Timeline {
  const { timeline, asset } = options;
  const music = musicTrackOf(options);
  const others = timeline.tracks.filter((track) => track.id !== music?.id);
  const clips = repeatedClipsOf({
    asset,
    videoFrames: musicLengthOf(options),
    gainDecibels:
      options.gainDecibels ??
      music?.clips[0]?.gainDecibels ??
      musicGainUnderVoice,
    takenIds: others.flatMap((track) => track.clips.map((clip) => clip.id)),
    assetStartFrame: options.assetStartFrame ?? 0,
  });
  if (music !== undefined) {
    return {
      ...timeline,
      tracks: timeline.tracks.map((track): Track =>
        track.id === music.id ? { ...music, clips } : track,
      ),
    };
  }
  const id = uniqueId({
    base: "music",
    taken: timeline.tracks.map((track) => track.id),
  });
  return {
    ...timeline,
    tracks: [...timeline.tracks, { id, kind: "audio", clips }],
  };
}
