import type { Asset, AudioClip, Edit, Timeline, Track } from "@yumekit/project";
import { uniqueId, videoSoundTrackId } from "./narrationPlan.js";
import { isSoundsTrack } from "./soundsTrack.js";

export const quietVoiceGainDecibels = -90;

const restoredGainDecibels = 0;

interface Window {
  startFrame: number;
  endFrame: number;
}

const voiceTrackIdPattern = /^(narration|voice)(-\d+)?$/;

function voiceTrackOf(options: {
  timeline: Timeline;
  assets: Asset[];
}): Track | undefined {
  const tracks = options.timeline.tracks.filter(
    (track) =>
      track.kind === "audio" &&
      track.id !== videoSoundTrackId &&
      !isSoundsTrack(track),
  );
  const wordAssetIds = new Set(
    options.assets.filter((asset) => asset.hasWords).map((asset) => asset.id),
  );
  return (
    tracks.find((track) =>
      track.clips.some(
        (clip) => "assetId" in clip && wordAssetIds.has(clip.assetId),
      ),
    ) ?? tracks.find((track) => voiceTrackIdPattern.test(track.id))
  );
}

function endOf(clip: AudioClip): number {
  return clip.startFrame + clip.durationFrames;
}

function pieceOf(options: {
  clip: AudioClip;
  id: string;
  startFrame: number;
  endFrame: number;
  gainDecibels: number;
}): AudioClip {
  const { clip, startFrame } = options;
  return {
    id: options.id,
    assetId: clip.assetId,
    startFrame,
    durationFrames: options.endFrame - startFrame,
    assetStartFrame: clip.assetStartFrame + (startFrame - clip.startFrame),
    gainDecibels: options.gainDecibels,
  };
}

function splitEdits(options: {
  timeline: Timeline;
  trackId: string;
  clip: AudioClip;
  window: Window;
  takenIds: string[];
}): Edit[] {
  const { clip, window, timeline, takenIds } = options;
  const middleStart = Math.max(clip.startFrame, window.startFrame);
  const middleEnd = Math.min(endOf(clip), window.endFrame);
  const kept: Edit = {
    kind: "updateClip",
    outputId: timeline.outputId,
    clipId: clip.id,
    changes:
      clip.startFrame < middleStart
        ? { durationFrames: middleStart - clip.startFrame }
        : {
            durationFrames: middleEnd - clip.startFrame,
            gainDecibels: quietVoiceGainDecibels,
          },
  };
  const added: AudioClip[] = [];
  const nextId = () => {
    const id = uniqueId({ base: `${clip.id}-part`, taken: takenIds });
    takenIds.push(id);
    return id;
  };
  if (clip.startFrame < middleStart) {
    added.push(
      pieceOf({
        clip,
        id: nextId(),
        startFrame: middleStart,
        endFrame: middleEnd,
        gainDecibels: quietVoiceGainDecibels,
      }),
    );
  }
  if (endOf(clip) > middleEnd) {
    added.push(
      pieceOf({
        clip,
        id: nextId(),
        startFrame: middleEnd,
        endFrame: endOf(clip),
        gainDecibels: clip.gainDecibels,
      }),
    );
  }
  return [
    kept,
    ...added.map((piece) => ({
      kind: "addClip" as const,
      outputId: timeline.outputId,
      trackId: options.trackId,
      clip: piece,
    })),
  ];
}

export function voiceLevelEdits(options: {
  timeline: Timeline;
  assets: Asset[];
  window: Window;
  quiet: boolean;
  takenIds: string[];
}): Edit[] {
  const { timeline, window } = options;
  const track = voiceTrackOf({ timeline, assets: options.assets });
  if (track?.kind !== "audio") return [];
  const trackId = track.id;
  const clips = track.clips.filter(
    (clip) =>
      clip.startFrame < window.endFrame && endOf(clip) > window.startFrame,
  );
  if (!options.quiet) {
    return clips
      .filter((clip) => clip.gainDecibels === quietVoiceGainDecibels)
      .map((clip) => ({
        kind: "updateClip" as const,
        outputId: timeline.outputId,
        clipId: clip.id,
        changes: { gainDecibels: restoredGainDecibels },
      }));
  }
  const takenIds = [...options.takenIds];
  return clips.flatMap((clip) =>
    splitEdits({ timeline, trackId, clip, window, takenIds }),
  );
}
