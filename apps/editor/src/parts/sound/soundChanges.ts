import type { EngineClient } from "../../engine/engineClient.js";
import type { Asset, Snapshot, Timeline } from "../../engine/snapshot.js";
import { changeProject } from "../../scenes/directChange.js";
import {
  musicTracksOf,
  voiceTrackOf,
  type SoundPartName,
} from "../../sound/soundRowFacts.js";
import { timelineOf } from "../../timeline/timelineFacts.js";
import {
  lengthWithoutTrack,
  repeatedClipsOf,
  timelineWithSound,
  type PlannedClip,
} from "./soundTimelines.js";

export type SoundChange =
  { kind: "done" } | { kind: "failed"; message: string };

export const musicGainUnderVoice = -12;

interface SoundPlan {
  trackId: string;
  clips: PlannedClip[];
  gainDecibels: number;
}

function planOf(options: {
  part: SoundPartName;
  timeline: Timeline;
  assets: Asset[];
  assetFrames: number;
}): SoundPlan {
  const { timeline, assets, assetFrames } = options;
  if (options.part === "voice") {
    const track = voiceTrackOf({ timeline, assets });
    const videoFrames = lengthWithoutTrack({ timeline, trackId: track?.id });
    const durationFrames = Math.min(assetFrames, videoFrames || assetFrames);
    return {
      trackId: track?.id ?? "narration",
      clips: [{ startFrame: 0, durationFrames }],
      gainDecibels: 0,
    };
  }
  const [track] = musicTracksOf({ timeline, assets });
  const videoFrames = lengthWithoutTrack({ timeline, trackId: track?.id });
  return {
    trackId: track?.id ?? "music",
    clips: repeatedClipsOf({ assetFrames, videoFrames }),
    gainDecibels: track?.clips[0]?.gainDecibels ?? musicGainUnderVoice,
  };
}

export async function placeSoundFile(options: {
  client: EngineClient;
  snapshot: Snapshot;
  part: SoundPartName;
  asset: Asset;
}): Promise<SoundChange> {
  const { client, snapshot, asset } = options;
  const assetFrames = asset.durationFrames ?? 0;
  if (asset.kind !== "audio" || assetFrames === 0) {
    return { kind: "failed", message: "This file has no sound to play." };
  }
  for (const output of snapshot.project.outputs) {
    const timeline = timelineOf({ snapshot, outputId: output.id });
    const plan = planOf({
      part: options.part,
      timeline,
      assets: [...snapshot.assets, asset],
      assetFrames,
    });
    if (plan.clips.length === 0) {
      return {
        kind: "failed",
        message: "The video has no scenes yet. Make the video first.",
      };
    }
    const changed = await changeProject({
      client,
      name: "set_timeline",
      input: timelineWithSound({ timeline, assetId: asset.id, ...plan }),
    });
    if (changed.kind === "failed") return changed;
  }
  return { kind: "done" };
}

export async function setMusicGain(options: {
  client: EngineClient;
  snapshot: Snapshot;
  gainDecibels: number;
}): Promise<SoundChange> {
  const { client, snapshot } = options;
  for (const timeline of snapshot.timelines) {
    const [track] = musicTracksOf({ timeline, assets: snapshot.assets });
    for (const clip of track?.clips ?? []) {
      const changed = await changeProject({
        client,
        name: "update_clip",
        input: {
          output_id: timeline.outputId,
          clip_id: clip.id,
          gain_decibels: options.gainDecibels,
        },
      });
      if (changed.kind === "failed") return changed;
    }
  }
  return { kind: "done" };
}
