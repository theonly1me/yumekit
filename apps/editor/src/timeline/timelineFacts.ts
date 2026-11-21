import type {
  Asset,
  AudioClip,
  Output,
  Scene,
  SceneClip,
  Snapshot,
  Timeline,
  Track,
} from "../engine/snapshot.js";

const captionComponent = "caption-words";

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

export function isCaptionScene(scene: Scene | undefined): boolean {
  return (
    scene?.source.kind === "kit" && scene.source.component === captionComponent
  );
}

export function isCaptionTrack(options: {
  track: Track;
  scenes: Scene[];
}): boolean {
  const { track, scenes } = options;
  return (
    track.kind === "scene" &&
    track.clips.length > 0 &&
    track.clips.every((clip) =>
      isCaptionScene(scenes.find((scene) => scene.id === clip.sceneId)),
    )
  );
}

export function mainSceneClipsOf(options: {
  timeline: Timeline;
  scenes: Scene[];
}): SceneClip[] {
  const mainTrack = options.timeline.tracks.find(
    (track) =>
      track.kind === "scene" &&
      !isCaptionTrack({ track, scenes: options.scenes }),
  );
  if (mainTrack?.kind !== "scene") return [];
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

export function audioClipsOf(timeline: Timeline): AudioClip[] {
  return timeline.tracks.flatMap((track) =>
    track.kind === "audio" ? track.clips : [],
  );
}

export function audioClipLabel(options: {
  clip: AudioClip;
  assets: Asset[];
}): string {
  const asset = options.assets.find(
    (candidate) => candidate.id === options.clip.assetId,
  );
  if (asset?.source.kind !== "tool") return options.clip.assetId;
  const { text, prompt } = asset.source.input;
  if (typeof text === "string") return text;
  return typeof prompt === "string" ? prompt : options.clip.assetId;
}

export function outputLabel(output: Output): string {
  return `${output.label.charAt(0).toUpperCase()}${output.label.slice(1)}`;
}

export function trackLabel(trackId: string): string {
  const words = trackId.replaceAll("-", " ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}
