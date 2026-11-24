import type { MusicCurve } from "@yumekit/render";
import { intensityAt, type MapPart } from "./musicMap.js";

export interface MusicFit {
  startSeconds: number;
  fit: number;
  peakSeconds: number;
  warnings: string[];
}

const smoothSteps = 4;

const fullLevelDecibels = 3;

const poorFit = 0.3;

const peakToleranceSeconds = 2;

function normalized(values: number[]): number[] {
  const mean =
    values.reduce((...[sum, value]) => sum + value, 0) /
    Math.max(1, values.length);
  const spread = Math.sqrt(
    values.reduce((...[sum, value]) => sum + (value - mean) ** 2, 0) /
      Math.max(1, values.length),
  );
  return values.map((value) => (spread === 0 ? 0 : (value - mean) / spread));
}

function smoothed(values: number[]): number[] {
  return values.map((...[, index]) => {
    const window = values.slice(index, index + smoothSteps);
    return window.reduce((...[sum, value]) => sum + value, 0) / window.length;
  });
}

function correlationOf(options: { first: number[]; second: number[] }): number {
  const first = normalized(options.first);
  const second = normalized(options.second);
  const sum = first.reduce(
    (...[total, value, index]) => total + value * (second[index] ?? 0),
    0,
  );
  return first.length === 0 ? 0 : sum / first.length;
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

function warningsAt(options: {
  curve: MusicCurve;
  parts: MapPart[];
  offset: number;
  steps: number;
  fit: number;
  peakSeconds: number;
}): string[] {
  const { curve, parts, offset, steps } = options;
  const loud = smoothed(curve.loudness.slice(offset, offset + steps));
  const loudest = Math.max(...loud);
  const firstLevel = loud[0] ?? loudest;
  const [firstPart] = parts;
  const shotParts = parts.filter((part) => part.name !== "end card");
  const top = Math.max(...shotParts.map((part) => part.intensity));
  const plannedPeak = shotParts.find((part) => part.intensity === top);
  const endCard = parts.find((part) => part.name === "end card");
  const film = rounded(steps * curve.stepSeconds);
  const raw = curve.loudness.slice(offset, offset + steps);
  const cardSteps =
    endCard === undefined
      ? []
      : raw.slice(Math.floor(endCard.fromSeconds / curve.stepSeconds));
  const cardLevel =
    cardSteps.reduce((...[sum, value]) => sum + value, 0) /
    Math.max(1, cardSteps.length);
  return [
    ...(firstPart !== undefined &&
    firstPart.intensity <= 2 &&
    firstLevel >= loudest - fullLevelDecibels
      ? [
          `The music starts near its full level (${String(Math.round(firstLevel))} dB, the loudest is ${String(Math.round(loudest))} dB), but the story starts quiet.`,
        ]
      : []),
    ...(options.fit < poorFit
      ? [
          `The music does not rise and fall with the story (fit ${String(rounded(options.fit))} of 1).`,
        ]
      : []),
    ...(plannedPeak !== undefined &&
    (options.peakSeconds < plannedPeak.fromSeconds - peakToleranceSeconds ||
      options.peakSeconds > plannedPeak.toSeconds + peakToleranceSeconds)
      ? [
          `The music peaks at ${String(options.peakSeconds)}s, but the story peaks in "${plannedPeak.name}" (${String(plannedPeak.fromSeconds)}s to ${String(plannedPeak.toSeconds)}s).`,
        ]
      : []),
    ...(endCard !== undefined &&
    cardSteps.length > 0 &&
    endCard.intensity < top &&
    cardLevel >= loudest - fullLevelDecibels
      ? [
          `The music under the end card (${String(Math.round(cardLevel))} dB) is as loud as its peak (${String(Math.round(loudest))} dB), but the story wants it quieter.`,
        ]
      : []),
    ...(curve.lengthSeconds + 0.25 < film
      ? [
          `The music (${String(curve.lengthSeconds)}s) is shorter than the film (${String(film)}s), so it repeats.`,
        ]
      : []),
  ];
}

export function musicFitOf(options: {
  curve: MusicCurve;
  parts: MapPart[];
}): MusicFit {
  const { curve, parts } = options;
  const brightness = normalized(curve.brightness);
  const level = normalized(curve.loudness).map(
    (...[value, index]) => (value + (brightness[index] ?? 0)) / 2,
  );
  const filmSeconds = parts.at(-1)?.toSeconds ?? 0;
  const steps = Math.max(1, Math.ceil(filmSeconds / curve.stepSeconds));
  const target = Array.from({ length: steps }, (...[, index]) =>
    intensityAt({ parts, seconds: (index + 0.5) * curve.stepSeconds }),
  );
  let best = { offset: 0, fit: Number.NEGATIVE_INFINITY };
  const lastOffset = Math.max(0, level.length - steps);
  for (let offset = 0; offset <= lastOffset; offset += 1) {
    const fit = correlationOf({
      first: target,
      second: level.slice(offset, offset + steps),
    });
    if (fit > best.fit) best = { offset, fit };
  }
  const window = smoothed(
    curve.loudness.slice(best.offset, best.offset + steps),
  );
  const peakIndex = window.indexOf(Math.max(...window));
  const peakSeconds = rounded(
    (peakIndex + smoothSteps / 2) * curve.stepSeconds,
  );
  const fit = rounded(best.fit);
  return {
    startSeconds: rounded(best.offset * curve.stepSeconds),
    fit,
    peakSeconds,
    warnings: warningsAt({
      curve,
      parts,
      offset: best.offset,
      steps,
      fit,
      peakSeconds,
    }),
  };
}
