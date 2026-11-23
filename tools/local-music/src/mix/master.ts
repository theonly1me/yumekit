import { sampleRate } from "../compose/timing.ts";
import { riseCurve } from "../sound/voice.ts";
import { filterInPlace, peakInPlace } from "./filters.ts";
import { limitInPlace } from "./limiter.ts";
import { loudnessOf } from "./loudness.ts";

export const targetLoudness = -17;
export const peakCeiling = 10 ** (-1.5 / 20);

const fadeInSeconds = 0.004;
const fadeOutSeconds = 0.35;

function scaleInPlace(options: {
  left: Float32Array;
  right: Float32Array;
  gainAt: (sampleIndex: number) => number;
}): void {
  for (let index = 0; index < options.left.length; index += 1) {
    const gain = options.gainAt(index);
    options.left[index] = (options.left[index] ?? 0) * gain;
    options.right[index] = (options.right[index] ?? 0) * gain;
  }
}

function levelAndLimit(options: {
  left: Float32Array;
  right: Float32Array;
}): void {
  const loudness = loudnessOf(options);
  if (!Number.isFinite(loudness)) return;
  const first = { left: options.left.slice(), right: options.right.slice() };
  const firstGain = 10 ** ((targetLoudness - loudness) / 20);
  scaleInPlace({ ...first, gainAt: () => firstGain });
  limitInPlace({ ...first, ceiling: peakCeiling });
  const shortfall = targetLoudness - loudnessOf(first);
  const gain = firstGain * 10 ** (Math.min(1.5, Math.max(0, shortfall)) / 20);
  scaleInPlace({ ...options, gainAt: () => gain });
  limitInPlace({ ...options, ceiling: peakCeiling });
}

export function finishMix(options: {
  left: Float32Array;
  right: Float32Array;
  brightnessHertz: number;
}): void {
  for (const samples of [options.left, options.right]) {
    filterInPlace({ samples, kind: "highpass", hertz: 32 });
    filterInPlace({ samples, kind: "lowpass", hertz: options.brightnessHertz });
    peakInPlace({ samples, hertz: 2600, gainDecibels: -2, resonance: 0.8 });
  }
  levelAndLimit(options);
  const total = options.left.length;
  const fadeIn = fadeInSeconds * sampleRate;
  const fadeOut = Math.min(fadeOutSeconds * sampleRate, total / 4);
  scaleInPlace({
    ...options,
    gainAt: (index) =>
      riseCurve(index / fadeIn) * riseCurve((total - 1 - index) / fadeOut),
  });
}
