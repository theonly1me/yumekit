import { succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import { findFfmpeg } from "../video/findFfmpeg.js";
import { cameraFitOf, gridSize } from "./cameraFit.js";
import { percentOf } from "./percentOf.js";
import {
  measureFramesPerSecond,
  measureSize,
  readGrayFrames,
  readGrayPicture,
} from "./grayFrames.js";
import {
  motionWarningsOf,
  type MotionStep,
  type MotionWarning,
  type StartDifference,
} from "./motionWarnings.js";

export interface ClipMotion {
  motion: number;
  worldMotion: number;
  cameraMotion: number;
  regions: number[];
  steps: MotionStep[];
  startDifference?: StartDifference;
  warnings: MotionWarning[];
}

function meanOf(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((...[sum, value]) => sum + value, 0) / values.length;
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

function startDifferenceOf(options: {
  first: Uint8Array;
  picture: Uint8Array;
}): StartDifference {
  const { width, height } = measureSize;
  const sums = new Array<number>(gridSize * gridSize).fill(0);
  const counts = new Array<number>(gridSize * gridSize).fill(0);
  let sum = 0;
  options.first.forEach((...[value, index]) => {
    const change = Math.abs(value - (options.picture[index] ?? 0));
    const row = Math.floor(index / width);
    const column = index % width;
    const region =
      Math.floor((row * gridSize) / height) * gridSize +
      Math.floor((column * gridSize) / width);
    sum += change;
    sums[region] = (sums[region] ?? 0) + change;
    counts[region] = (counts[region] ?? 0) + 1;
  });
  return {
    whole: rounded(percentOf({ total: sum, count: options.first.length })),
    largestRegion: rounded(
      Math.max(
        ...sums.map((...[total, index]) =>
          percentOf({ total, count: counts[index] ?? 0 }),
        ),
      ),
    ),
  };
}

async function startOf(options: {
  first: Uint8Array | undefined;
  startPicture: string | undefined;
}): Promise<Outcome<StartDifference | undefined, RenderFailure>> {
  if (options.first === undefined || options.startPicture === undefined) {
    return succeed(undefined);
  }
  const picture = await readGrayPicture(options.startPicture);
  if (!picture.ok) return picture;
  return succeed(
    startDifferenceOf({ first: options.first, picture: picture.value }),
  );
}

export async function measureClipMotion(options: {
  file: string;
  startPicture?: string;
}): Promise<Outcome<ClipMotion, RenderFailure>> {
  const missing = await findFfmpeg();
  if (missing !== undefined) return { ok: false, failure: missing };
  const frames = await readGrayFrames(options.file);
  if (!frames.ok) return frames;
  const start = await startOf({
    first: frames.value[0],
    startPicture: options.startPicture,
  });
  if (!start.ok) return start;
  const fits = frames.value.slice(1).map((...[after, index]) => ({
    seconds: rounded((index + 1) / measureFramesPerSecond),
    fit: cameraFitOf({ before: frames.value[index] ?? after, after }),
  }));
  const steps: MotionStep[] = fits.map(({ seconds, fit }) => ({
    seconds,
    motion: rounded(fit.motion),
    worldMotion: rounded(fit.worldMotion),
    regions: fit.regions.map(rounded),
  }));
  const motion = rounded(meanOf(steps.map((step) => step.motion)));
  const worldMotion = rounded(meanOf(steps.map((step) => step.worldMotion)));
  const regions = Array.from({ length: gridSize * gridSize }, (...[, region]) =>
    rounded(meanOf(steps.map((step) => step.regions[region] ?? 0))),
  );
  const cameraMotion = rounded(
    meanOf(
      fits.map(({ fit }) => {
        const shift = Math.hypot(fit.shiftX, fit.shiftY);
        const zoomShift = Math.abs(1 - fit.zoom) * (measureSize.width / 2);
        return ((shift + zoomShift) / measureSize.width) * 100;
      }),
    ) * measureFramesPerSecond,
  );
  return succeed({
    motion,
    worldMotion,
    cameraMotion,
    regions,
    steps,
    ...(start.value === undefined ? {} : { startDifference: start.value }),
    warnings: motionWarningsOf({
      steps,
      motion,
      worldMotion,
      cameraMotion,
      regions,
      start: start.value,
    }),
  });
}
