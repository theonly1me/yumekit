import { join } from "node:path";
import type { Asset, AudioClip, Timeline } from "@yumekit/project";
import type { FrameRange } from "../project/frameRange.js";

export const audioSampleRate = 48_000;

export interface AudioMix {
  inputFiles: string[];
  filterGraph: string;
  outputLabel: string;
}

interface PlacedClip {
  file: string;
  assetStartSample: number;
  sampleCount: number;
  delaySamples: number;
  gainDecibels: number;
}

function placeClip(options: {
  clip: AudioClip;
  range: FrameRange;
  file: string;
  samplesPerFrame: number;
}): PlacedClip | undefined {
  const { clip, range, samplesPerFrame } = options;
  const visibleStart = Math.max(clip.startFrame, range.firstFrame);
  const visibleEnd = Math.min(
    clip.startFrame + clip.durationFrames,
    range.firstFrame + range.frameCount,
  );
  if (visibleEnd <= visibleStart) {
    return undefined;
  }
  return {
    file: options.file,
    assetStartSample:
      (clip.assetStartFrame + visibleStart - clip.startFrame) * samplesPerFrame,
    sampleCount: (visibleEnd - visibleStart) * samplesPerFrame,
    delaySamples: (visibleStart - range.firstFrame) * samplesPerFrame,
    gainDecibels: clip.gainDecibels,
  };
}

const monoToStereo = "pan=stereo|c0=c0|c1=c0";

function clipFilter(options: {
  placed: PlacedClip;
  inputIndex: number;
  isMono: boolean;
}): string {
  const { placed, inputIndex } = options;
  return [
    `[${String(inputIndex)}:a]${options.isMono ? `${monoToStereo},` : ""}aresample=${String(audioSampleRate)}`,
    "aformat=sample_fmts=fltp:channel_layouts=stereo",
    `atrim=start_sample=${String(placed.assetStartSample)}:end_sample=${String(placed.assetStartSample + placed.sampleCount)}`,
    "asetpts=PTS-STARTPTS",
    `adelay=delays=${String(placed.delaySamples)}S:all=1`,
    `volume=${String(placed.gainDecibels)}dB[clip${String(inputIndex)}]`,
  ].join(",");
}

export function audioMixOf(options: {
  folder: string;
  timeline: Timeline;
  assets: Asset[];
  range: FrameRange;
  framesPerSecond: number;
  firstInputIndex: number;
  monoFiles: Set<string>;
}): AudioMix | undefined {
  const { range, firstInputIndex } = options;
  const samplesPerFrame = audioSampleRate / options.framesPerSecond;
  const fileOfAsset = new Map(
    options.assets.map((asset) => [asset.id, join(options.folder, asset.file)]),
  );
  const placedClips = options.timeline.tracks
    .flatMap((track) => (track.kind === "audio" ? track.clips : []))
    .flatMap((clip) => {
      const file = fileOfAsset.get(clip.assetId);
      const placed =
        file === undefined
          ? undefined
          : placeClip({ clip, range, file, samplesPerFrame });
      return placed === undefined ? [] : [placed];
    });
  if (placedClips.length === 0) {
    return undefined;
  }
  const totalSamples = range.frameCount * samplesPerFrame;
  const indexedClips = [...placedClips.entries()].map(
    ([clipIndex, placed]) => ({
      placed,
      inputIndex: firstInputIndex + clipIndex,
      isMono: options.monoFiles.has(placed.file),
    }),
  );
  const labels = indexedClips
    .map(({ inputIndex }) => `[clip${String(inputIndex)}]`)
    .join("");
  const filters = indexedClips.map(clipFilter);
  const mix = `${labels}amix=inputs=${String(placedClips.length)}:normalize=0:duration=longest,apad=whole_len=${String(totalSamples)},atrim=end_sample=${String(totalSamples)}[audio]`;
  return {
    inputFiles: placedClips.map((placed) => placed.file),
    filterGraph: [...filters, mix].join(";"),
    outputLabel: "[audio]",
  };
}
