import type { Asset } from "../format/asset.js";
import type { ProjectState } from "../format/state.js";
import type { AudioClip, Timeline, Track } from "../format/timeline.js";
import { timelineFile, type RuleFailure } from "./ruleFailure.js";

function checkOverlap(options: {
  track: Track;
  file: string;
}): RuleFailure | undefined {
  const clips: { id: string; startFrame: number; durationFrames: number }[] =
    options.track.clips;
  for (const clip of clips) {
    const overlapping = clips.find(
      (other) =>
        other !== clip &&
        other.startFrame < clip.startFrame + clip.durationFrames &&
        clip.startFrame < other.startFrame + other.durationFrames,
    );
    if (overlapping !== undefined) {
      return {
        kind: "clips-overlap",
        message: `The clips "${clip.id}" and "${overlapping.id}" overlap on the track "${options.track.id}".`,
        file: options.file,
      };
    }
  }
  return undefined;
}

function hasSound(asset: Asset): boolean {
  return (
    asset.kind === "audio" ||
    (asset.kind === "video" && asset.hasAudio === true)
  );
}

function checkAudioClip(options: {
  clip: AudioClip;
  assets: Asset[];
  file: string;
}): RuleFailure | undefined {
  const { clip, file } = options;
  const asset = options.assets.find(
    (candidate) => candidate.id === clip.assetId,
  );
  if (asset === undefined) {
    return {
      kind: "not-found",
      message: `The clip "${clip.id}" references the asset "${clip.assetId}", which does not exist.`,
      file,
    };
  }
  if (!hasSound(asset)) {
    return {
      kind: "invalid-value",
      message:
        asset.kind === "video"
          ? `The audio clip "${clip.id}" references the video asset "${asset.id}", which has no sound.`
          : `The audio clip "${clip.id}" references the asset "${asset.id}" of kind ${asset.kind}. It must be of kind audio, or of kind video with sound.`,
      file,
    };
  }
  if (asset.durationFrames === undefined) {
    return {
      kind: "invalid-value",
      message: `The audio clip "${clip.id}" references the asset "${asset.id}", which has no durationFrames.`,
      file,
    };
  }
  if (clip.assetStartFrame + clip.durationFrames > asset.durationFrames) {
    return {
      kind: "invalid-value",
      message: `The audio clip "${clip.id}" reads to frame ${String(clip.assetStartFrame + clip.durationFrames)}, past the end of the asset "${asset.id}" at frame ${String(asset.durationFrames)}.`,
      file,
    };
  }
  return undefined;
}

function checkTrackReferences(options: {
  track: Track;
  state: ProjectState;
  file: string;
}): RuleFailure | undefined {
  const { track, state, file } = options;
  if (track.kind === "audio") {
    for (const clip of track.clips) {
      const failure = checkAudioClip({ clip, assets: state.assets, file });
      if (failure !== undefined) {
        return failure;
      }
    }
    return undefined;
  }
  const sceneIds = new Set(state.scenes.map((scene) => scene.id));
  const missing = track.clips.find((clip) => !sceneIds.has(clip.sceneId));
  if (missing === undefined) {
    return undefined;
  }
  return {
    kind: "not-found",
    message: `The clip "${missing.id}" references the scene "${missing.sceneId}", which does not exist.`,
    file,
  };
}

function checkTimeline(options: {
  timeline: Timeline;
  state: ProjectState;
}): RuleFailure | undefined {
  const file = timelineFile(options.timeline.outputId);
  for (const track of options.timeline.tracks) {
    const failure =
      checkTrackReferences({ track, state: options.state, file }) ??
      checkOverlap({ track, file });
    if (failure !== undefined) {
      return failure;
    }
  }
  return undefined;
}

export function checkClips(state: ProjectState): RuleFailure | undefined {
  for (const timeline of state.timelines) {
    const failure = checkTimeline({ timeline, state });
    if (failure !== undefined) {
      return failure;
    }
  }
  return undefined;
}
