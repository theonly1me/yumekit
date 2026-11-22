import type { Asset, Scene, Timeline, Track } from "../engine/snapshot.js";
import { audioClipLabel, isCaptionTrack } from "../timeline/timelineFacts.js";

export type SoundPartName = "voice" | "music";

export interface SoundRow {
  trackId: string;
  name: string;
  part: SoundPartName | undefined;
  choice: string;
  isOff: boolean;
}

const videoSoundTrackId = "video-sound";
const captionStyle = "Word by word";

export type AudioTrack = Extract<Track, { kind: "audio" }>;

const voiceTrackIdPattern = /^(narration|voice)(-\d+)?$/;

function hasVoiceClip(options: { track: AudioTrack; assets: Asset[] }) {
  return options.track.clips.some((clip) =>
    options.assets.some((asset) => asset.id === clip.assetId && asset.hasWords),
  );
}

export function audioTracksOf(timeline: Timeline): AudioTrack[] {
  return timeline.tracks.filter(
    (track): track is AudioTrack => track.kind === "audio",
  );
}

export function voiceTrackOf(options: {
  timeline: Timeline;
  assets: Asset[];
}): AudioTrack | undefined {
  const audioTracks = audioTracksOf(options.timeline);
  return (
    audioTracks.find((track) =>
      hasVoiceClip({ track, assets: options.assets }),
    ) ?? audioTracks.find((track) => voiceTrackIdPattern.test(track.id))
  );
}

export function musicTracksOf(options: {
  timeline: Timeline;
  assets: Asset[];
}): AudioTrack[] {
  const voice = voiceTrackOf(options);
  return audioTracksOf(options.timeline).filter(
    (track) => track !== voice && track.id !== videoSoundTrackId,
  );
}

function choiceOf(options: { track: AudioTrack; assets: Asset[] }): string {
  const [first] = options.track.clips;
  return first === undefined
    ? "No clips yet"
    : audioClipLabel({ clip: first, assets: options.assets });
}

export function soundRowsOf(options: {
  timeline: Timeline;
  scenes: Scene[];
  assets: Asset[];
}): SoundRow[] {
  const { timeline, scenes, assets } = options;
  const voice = voiceTrackOf({ timeline, assets });
  const music = musicTracksOf({ timeline, assets });
  const captions = timeline.tracks.find((track) =>
    isCaptionTrack({ track, scenes }),
  );
  const rowOf = (row: {
    track: Track;
    name: string;
    part?: SoundPartName;
    choice: string;
  }) => ({
    trackId: row.track.id,
    name: row.name,
    part: row.part,
    choice: row.choice,
    isOff: row.track.off === true,
  });
  return [
    ...(voice === undefined
      ? []
      : [
          rowOf({
            track: voice,
            name: "Voice",
            part: "voice",
            choice: choiceOf({ track: voice, assets }),
          }),
        ]),
    ...music.map((...[track, index]) =>
      rowOf({
        track,
        name: index === 0 ? "Music" : `Music ${String(index + 1)}`,
        ...(index === 0 ? { part: "music" as const } : {}),
        choice: choiceOf({ track, assets }),
      }),
    ),
    ...(captions === undefined
      ? []
      : [rowOf({ track: captions, name: "Captions", choice: captionStyle })]),
  ];
}
