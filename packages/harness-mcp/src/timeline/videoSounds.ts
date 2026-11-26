import {
  scenesRowOf,
  type AudioClip,
  type ProjectSnapshot,
  type SceneClip,
  type Timeline,
} from "@yumekit/project";
import { videoSoundTrackId } from "./narrationPlan.js";

interface ShownVideos {
  entries: { assetId: string; clip: SceneClip }[];
  counts: Map<string, number>;
}

export function videoAssetIdOf(options: {
  snapshot: ProjectSnapshot;
  clip: SceneClip;
}): string | undefined {
  const scene = options.snapshot.scenes.find(
    (candidate) => candidate.id === options.clip.sceneId,
  );
  if (scene?.source.kind !== "kit") return undefined;
  if (scene.source.component !== "video-clip") return undefined;
  const assetId = scene.source.props["assetId"];
  return typeof assetId === "string" ? assetId : undefined;
}

function countBy(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function shownVideosOf(options: {
  snapshot: ProjectSnapshot;
  sceneClips: SceneClip[];
}): ShownVideos {
  const entries = options.sceneClips.flatMap((clip) => {
    const assetId = videoAssetIdOf({ snapshot: options.snapshot, clip });
    return assetId === undefined ? [] : [{ assetId, clip }];
  });
  return { entries, counts: countBy(entries.map((entry) => entry.assetId)) };
}

function onlyClipOf(options: {
  shown: ShownVideos;
  assetId: string;
}): SceneClip | undefined {
  if (options.shown.counts.get(options.assetId) !== 1) return undefined;
  return options.shown.entries.find(
    (entry) => entry.assetId === options.assetId,
  )?.clip;
}

function soundLengthOf(options: {
  snapshot: ProjectSnapshot;
  sound: AudioClip;
  clip: SceneClip;
  clipBefore: SceneClip;
}): number {
  const { sound, clip } = options;
  const keptLength = Math.min(sound.durationFrames, clip.durationFrames);
  if (options.clipBefore.durationFrames === clip.durationFrames) {
    return keptLength;
  }
  const fileFrames = options.snapshot.assets.find(
    (asset) => asset.id === sound.assetId,
  )?.durationFrames;
  const framesLeft =
    fileFrames === undefined ? 0 : fileFrames - sound.assetStartFrame;
  return framesLeft < 1
    ? keptLength
    : Math.min(clip.durationFrames, framesLeft);
}

function soundAfterChange(options: {
  snapshot: ProjectSnapshot;
  sound: AudioClip;
  before: ShownVideos;
  after: ShownVideos;
}): AudioClip[] {
  const { sound, before, after } = options;
  const wasOnlyClip =
    onlyClipOf({ shown: before, assetId: sound.assetId }) !== undefined;
  if (wasOnlyClip && !after.counts.has(sound.assetId)) return [];
  const clip = onlyClipOf({ shown: after, assetId: sound.assetId });
  const clipBefore = before.entries.find(
    (entry) => entry.clip.id === clip?.id,
  )?.clip;
  const isInPlace =
    clipBefore?.startFrame === clip?.startFrame &&
    clipBefore?.durationFrames === clip?.durationFrames;
  if (clip === undefined || clipBefore === undefined || isInPlace) {
    return [sound];
  }
  return [
    {
      ...sound,
      startFrame: clip.startFrame,
      durationFrames: soundLengthOf({ ...options, clip, clipBefore }),
    },
  ];
}

export function tracksWithVideoSounds(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
  sceneClips: SceneClip[];
}): Timeline["tracks"] {
  const { snapshot } = options;
  const rowBefore = scenesRowOf({
    tracks: options.timeline.tracks,
    scenes: snapshot.scenes,
  });
  const before = shownVideosOf({
    snapshot,
    sceneClips: rowBefore?.clips ?? [],
  });
  const after = shownVideosOf({ snapshot, sceneClips: options.sceneClips });
  return options.timeline.tracks.map((track) => {
    if (track.kind !== "audio" || track.id !== videoSoundTrackId) return track;
    const soundCounts = countBy(track.clips.map((clip) => clip.assetId));
    return {
      ...track,
      clips: track.clips.flatMap((sound) =>
        soundCounts.get(sound.assetId) === 1
          ? soundAfterChange({ snapshot, sound, before, after })
          : [sound],
      ),
    };
  });
}
