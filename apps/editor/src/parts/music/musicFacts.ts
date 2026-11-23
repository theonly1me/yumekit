import type { Asset, Snapshot } from "../../engine/snapshot.js";
import { musicTracksOf, type AudioTrack } from "../../sound/soundRowFacts.js";
import type { SoundPiece } from "../sound/useSoundPlayer.js";
import { musicGainUnderVoice } from "../sound/soundChanges.js";
import { assetNameOf } from "../../names/index.js";

export interface MusicFacts {
  track: AudioTrack | undefined;
  asset: Asset | undefined;
  piece: SoundPiece | undefined;
  name: string;
  length: string;
  gainDecibels: number;
}

function nameOf(asset: Asset): string {
  if (asset.source.kind === "import") return asset.source.originalName;
  const { prompt, text } = asset.source.input;
  if (typeof prompt === "string") return prompt;
  return typeof text === "string" ? text : assetNameOf(asset);
}

export function clockOf(seconds: number): string {
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  return `${String(minutes)}:${String(whole % 60).padStart(2, "0")}`;
}

export function musicFactsOf(snapshot: Snapshot): MusicFacts {
  const { assets } = snapshot;
  const framesPerSecond = snapshot.project.framesPerSecond;
  const track = snapshot.timelines
    .map((timeline) => musicTracksOf({ timeline, assets })[0])
    .find((candidate) => candidate !== undefined);
  const [clip] = track?.clips ?? [];
  const asset = assets.find((candidate) => candidate.id === clip?.assetId);
  const lengthFrames = asset?.durationFrames ?? clip?.durationFrames ?? 0;
  return {
    track,
    asset,
    piece:
      asset === undefined
        ? undefined
        : {
            assetId: asset.id,
            startSeconds: 0,
            lengthSeconds: lengthFrames / framesPerSecond,
          },
    name: asset === undefined ? "" : nameOf(asset),
    length: clockOf(lengthFrames / framesPerSecond),
    gainDecibels: clip?.gainDecibels ?? musicGainUnderVoice,
  };
}
