import { readFile } from "node:fs/promises";

export interface WavFacts {
  bytes: Buffer;
  sampleRate: number;
  channels: number;
  left: Float64Array;
  right: Float64Array;
}

export async function readWav(path: string): Promise<WavFacts> {
  const bytes = await readFile(path);
  const channels = bytes.readUInt16LE(22);
  const sampleRate = bytes.readUInt32LE(24);
  const frames = bytes.readUInt32LE(40) / (channels * 2);
  const left = new Float64Array(frames);
  const right = new Float64Array(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    left[frame] = bytes.readInt16LE(44 + frame * channels * 2) / 32768;
    right[frame] = bytes.readInt16LE(44 + frame * channels * 2 + 2) / 32768;
  }
  return { bytes, sampleRate, channels, left, right };
}

export function peakOf(wav: WavFacts): number {
  let peak = 0;
  for (const samples of [wav.left, wav.right]) {
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  }
  return peak;
}

export function largestStepOf(options: {
  samples: Float64Array;
  from: number;
  to: number;
}): number {
  let largest = 0;
  for (let index = Math.max(1, options.from); index < options.to; index += 1) {
    largest = Math.max(
      largest,
      Math.abs(
        (options.samples[index] ?? 0) - (options.samples[index - 1] ?? 0),
      ),
    );
  }
  return largest;
}

function edgeOf(options: { samples: Float64Array; index: number }): number {
  const { samples, index } = options;
  return (
    (samples[index] ?? 0) -
    2 * (samples[index - 1] ?? 0) +
    (samples[index - 2] ?? 0)
  );
}

function onsetStrengthsOf(wav: WavFacts): Float64Array {
  const frame = Math.round(0.002 * wav.sampleRate);
  const count = Math.floor(wav.left.length / frame);
  const strengths = new Float64Array(count);
  let previous = 0;
  for (let frameIndex = 0; frameIndex < count; frameIndex += 1) {
    let energy = 1e-9;
    for (
      let index = frameIndex * frame;
      index < (frameIndex + 1) * frame;
      index += 1
    ) {
      energy += edgeOf({ samples: wav.left, index }) ** 2;
      energy += edgeOf({ samples: wav.right, index }) ** 2;
    }
    const level = Math.sqrt(energy);
    strengths[frameIndex] = Math.max(0, level - previous);
    previous = level;
  }
  return strengths;
}

export function repeatStrengthOf(options: {
  wav: WavFacts;
  periodSeconds: number;
}): number {
  const strengths = onsetStrengthsOf(options.wav);
  const lag = Math.round(options.periodSeconds / 0.002);
  let together = 0;
  let alone = 0;
  for (let index = 0; index + lag < strengths.length; index += 1) {
    together += (strengths[index] ?? 0) * (strengths[index + lag] ?? 0);
    alone += (strengths[index] ?? 0) ** 2;
  }
  return together / alone;
}
