import { assetUsesOf, type AssetUse } from "@yumekit/project/asset-uses";
import type { Snapshot } from "../../engine/snapshot.js";
import { musicTracksOf, voiceTrackOf } from "../../sound/soundRowFacts.js";
import {
  isCaptionTrack,
  mainSceneClipsOf,
} from "../../timeline/timelineFacts.js";

export type SoundUse = "voice" | "music" | "sounds" | "video-sound";

const soundsTrackPattern = /^sounds(-\d+)?$/;

export function soundUseOf(options: {
  snapshot: Snapshot;
  outputId: string;
  trackId: string;
}): SoundUse {
  const { snapshot } = options;
  const timeline = snapshot.timelines.find(
    (candidate) => candidate.outputId === options.outputId,
  );
  if (timeline === undefined) return "sounds";
  const { assets } = snapshot;
  if (voiceTrackOf({ timeline, assets })?.id === options.trackId) {
    return "voice";
  }
  if (options.trackId === "video-sound") return "video-sound";
  if (soundsTrackPattern.test(options.trackId)) return "sounds";
  return musicTracksOf({ timeline, assets }).some(
    (track) => track.id === options.trackId,
  )
    ? "music"
    : "sounds";
}

function sceneLabelOf(options: { snapshot: Snapshot; sceneId: string }) {
  const { snapshot, sceneId } = options;
  const { scenes } = snapshot;
  const isCaption = snapshot.timelines.some((timeline) =>
    timeline.tracks.some(
      (track) =>
        track.kind === "scene" &&
        isCaptionTrack({ track, scenes }) &&
        track.clips.some((clip) => clip.sceneId === sceneId),
    ),
  );
  if (isCaption) return "Captions";
  for (const timeline of snapshot.timelines) {
    const index = mainSceneClipsOf({ timeline, scenes }).findIndex(
      (clip) => clip.sceneId === sceneId,
    );
    if (index >= 0) return `Scene ${String(index + 1)}`;
  }
  const title = scenes.find((scene) => scene.id === sceneId)?.title ?? sceneId;
  return `The scene ${title}, not in the video`;
}

const soundLabels: Record<SoundUse, string | undefined> = {
  voice: "Voice",
  music: "Music",
  sounds: "Sounds",
  "video-sound": undefined,
};

function placeLabelOf(options: {
  snapshot: Snapshot;
  use: AssetUse;
}): string | undefined {
  const { snapshot, use } = options;
  switch (use.kind) {
    case "scene":
      return sceneLabelOf({ snapshot, sceneId: use.sceneId });
    case "audio-clip":
      return soundLabels[soundUseOf({ snapshot, ...use })];
    case "cast-member":
      return "The cast";
  }
}

export function assetUsesIn(options: {
  snapshot: Snapshot;
  assetId: string;
}): AssetUse[] {
  return assetUsesOf({ project: options.snapshot, assetId: options.assetId });
}

export function placeLabelsOf(options: {
  snapshot: Snapshot;
  uses: AssetUse[];
}): string[] {
  const labels = options.uses.flatMap((use) => {
    const label = placeLabelOf({ snapshot: options.snapshot, use });
    return label === undefined ? [] : [label];
  });
  const unique = [...new Set(labels)];
  return unique.length === 0 && options.uses.length > 0
    ? ["The sound of a video clip"]
    : unique;
}
