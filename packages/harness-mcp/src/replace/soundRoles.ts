import {
  isCaptionTrack,
  type Asset,
  type ProjectSnapshot,
  type Timeline,
  type Track,
} from "@yumekit/project";
import { videoSoundTrackId } from "../timeline/narrationPlan.js";
import { isSoundsTrack } from "../timeline/soundsTrack.js";
import { lengthFramesOf } from "../timeline/wireTimeline.js";

export type AudioTrack = Extract<Track, { kind: "audio" }>;

const voiceTrackPattern = /^(narration|voice)(-\d+)?$/;

export function isSpeechAsset(asset: Asset | undefined): boolean {
  if (asset?.kind !== "audio") return false;
  return asset.source.kind === "tool"
    ? asset.source.tool === "generate_speech"
    : asset.hasWords;
}

function isSharedAudio(track: Track): track is AudioTrack {
  return (
    track.kind === "audio" &&
    track.id !== videoSoundTrackId &&
    !isSoundsTrack(track)
  );
}

export function voiceTrackOf(options: {
  timeline: Timeline;
  assets: Asset[];
}): AudioTrack | undefined {
  const tracks = options.timeline.tracks.filter(isSharedAudio);
  return (
    tracks.find((track) =>
      track.clips.some((clip) =>
        isSpeechAsset(
          options.assets.find((asset) => asset.id === clip.assetId),
        ),
      ),
    ) ?? tracks.find((track) => voiceTrackPattern.test(track.id))
  );
}

export function musicTrackOf(options: {
  timeline: Timeline;
  assets: Asset[];
}): AudioTrack | undefined {
  const voice = voiceTrackOf(options);
  return options.timeline.tracks
    .filter(isSharedAudio)
    .find((track) => track.id !== voice?.id);
}

export function captionTrackOf(options: {
  timeline: Timeline;
  snapshot: ProjectSnapshot;
}): Track | undefined {
  return options.timeline.tracks.find((track) =>
    isCaptionTrack({ track, scenes: options.snapshot.scenes }),
  );
}

export function lengthWithout(options: {
  timeline: Timeline;
  trackIds: string[];
}): number {
  return lengthFramesOf({
    ...options.timeline,
    tracks: options.timeline.tracks.filter(
      (track) => !options.trackIds.includes(track.id),
    ),
  });
}

export function outputIdsOf(options: {
  snapshot: ProjectSnapshot;
  outputIds: string[] | undefined;
}): string[] {
  return (
    options.outputIds ??
    options.snapshot.project.outputs.map((output) => output.id)
  );
}
