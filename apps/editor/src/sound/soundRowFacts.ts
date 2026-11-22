import type { Asset, Scene, Timeline, Track } from "../engine/snapshot.js";
import { audioClipLabel, isCaptionTrack } from "../timeline/timelineFacts.js";

export interface SoundRow {
  trackId: string;
  name: string;
  choice: string;
  isOff: boolean;
}

const videoSoundTrackId = "video-sound";
const captionStyle = "Word by word";

type AudioTrack = Extract<Track, { kind: "audio" }>;

function isVoiceTrack(options: { track: AudioTrack; assets: Asset[] }) {
  return options.track.clips.some((clip) =>
    options.assets.some((asset) => asset.id === clip.assetId && asset.hasWords),
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
  const audioTracks = timeline.tracks.filter(
    (track): track is AudioTrack => track.kind === "audio",
  );
  const voice = audioTracks.find((track) => isVoiceTrack({ track, assets }));
  const music = audioTracks.filter(
    (track) => track !== voice && track.id !== videoSoundTrackId,
  );
  const captions = timeline.tracks.find((track) =>
    isCaptionTrack({ track, scenes }),
  );
  const rowOf = (row: { track: Track; name: string; choice: string }) => ({
    trackId: row.track.id,
    name: row.name,
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
            choice: choiceOf({ track: voice, assets }),
          }),
        ]),
    ...music.map((...[track, index]) =>
      rowOf({
        track,
        name: index === 0 ? "Music" : `Music ${String(index + 1)}`,
        choice: choiceOf({ track, assets }),
      }),
    ),
    ...(captions === undefined
      ? []
      : [rowOf({ track: captions, name: "Captions", choice: captionStyle })]),
  ];
}
