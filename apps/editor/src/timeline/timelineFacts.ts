import { scenesRowOf } from "@yumekit/project/scenes-row";
import type {
  Asset,
  AudioClip,
  Output,
  Scene,
  SceneClip,
  Snapshot,
  Timeline,
} from "../engine/snapshot.js";

import { assetNameOf } from "../names/index.js";

export function timelineOf(options: {
  snapshot: Snapshot;
  outputId: string;
}): Timeline {
  return (
    options.snapshot.timelines.find(
      (timeline) => timeline.outputId === options.outputId,
    ) ?? { outputId: options.outputId, tracks: [] }
  );
}

export function lengthFramesOf(timeline: Timeline): number {
  const clipEnds = timeline.tracks.flatMap((track) =>
    track.clips.map((clip) => clip.startFrame + clip.durationFrames),
  );
  return Math.max(0, ...clipEnds);
}

export function mainSceneClipsOf(options: {
  timeline: Timeline;
  scenes: Scene[];
}): SceneClip[] {
  const mainTrack = scenesRowOf({
    tracks: options.timeline.tracks,
    scenes: options.scenes,
  });
  if (mainTrack === undefined) return [];
  return [...mainTrack.clips].sort(
    (...[first, second]) => first.startFrame - second.startFrame,
  );
}

export function clipAt(options: {
  clips: SceneClip[];
  frame: number;
}): SceneClip | undefined {
  return options.clips.find(
    (clip) =>
      options.frame >= clip.startFrame &&
      options.frame < clip.startFrame + clip.durationFrames,
  );
}

export function audibleClipsOf(timeline: Timeline): AudioClip[] {
  return timeline.tracks.flatMap((track) =>
    track.kind === "audio" && track.off !== true ? track.clips : [],
  );
}

export function audioClipLabel(options: {
  clip: AudioClip;
  assets: Asset[];
}): string {
  const asset = options.assets.find(
    (candidate) => candidate.id === options.clip.assetId,
  );
  if (asset?.source.kind === "import") return asset.source.originalName;
  if (asset === undefined) return "Sound";
  const { text, prompt } = asset.source.input;
  if (typeof text === "string") return text;
  return typeof prompt === "string" ? prompt : assetNameOf(asset);
}

export function outputLabel(output: Output): string {
  return `${output.label.charAt(0).toUpperCase()}${output.label.slice(1)}`;
}

export function trackLabel(trackId: string): string {
  const words = trackId.replaceAll("-", " ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

export { isCaptionTrack } from "@yumekit/project/scenes-row";
