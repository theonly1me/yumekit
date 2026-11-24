export const motionLimits = {
  stillPercent: 0.3,
  cameraOnlyShare: 0.25,
  cameraMovingPercent: 0.5,
  stillRegionPercent: 0.6,
  stillRegionCount: 5,
  jumpFloorPercent: 6,
  jumpTimesMedian: 4,
  suddenFloorPercent: 4,
  suddenTimesMedian: 3,
  suddenTimesBefore: 2,
  startWholePercent: 10,
} as const;

export const regionNames = [
  "top left",
  "top",
  "top right",
  "left",
  "middle",
  "right",
  "bottom left",
  "bottom",
  "bottom right",
] as const;

export type MotionWarningKind =
  | "almost-still"
  | "only-camera-moves"
  | "still-background"
  | "hard-jump"
  | "sudden-change"
  | "does-not-start-on-the-start-picture";

export interface MotionWarning {
  kind: MotionWarningKind;
  message: string;
  seconds?: number;
}

export interface MotionStep {
  seconds: number;
  motion: number;
  worldMotion: number;
  regions: number[];
}

export interface StartDifference {
  whole: number;
  largestRegion: number;
}

export function medianOf(values: number[]): number {
  const sorted = [...values].sort((...[first, second]) => first - second);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length === 0) return 0;
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

function jumpWarnings(steps: MotionStep[]): MotionWarning[] {
  const median = medianOf(steps.map((step) => step.motion));
  const limit = Math.max(
    motionLimits.jumpFloorPercent,
    motionLimits.jumpTimesMedian * median,
  );
  return steps
    .filter((step) => step.motion > limit)
    .map((step) => ({
      kind: "hard-jump",
      seconds: step.seconds,
      message: `The picture jumps at ${String(step.seconds)} seconds: ${String(rounded(step.motion))} percent of it changes in one step, ${String(rounded(median))} percent in a usual step. Look for a cut, a flash, or a new place.`,
    }));
}

function suddenWarnings(steps: MotionStep[]): MotionWarning[] {
  const jumpSeconds = new Set(
    jumpWarnings(steps).map((warning) => warning.seconds),
  );
  const warnings: MotionWarning[] = [];
  regionNames.forEach((...[name, region]) => {
    const values = steps.map((step) => step.regions[region] ?? 0);
    const limit = Math.max(
      motionLimits.suddenFloorPercent,
      motionLimits.suddenTimesMedian * medianOf(values),
    );
    const index = values.findIndex((...[value, stepIndex]) => {
      const before = stepIndex === 0 ? undefined : values[stepIndex - 1];
      const seconds = steps[stepIndex]?.seconds;
      return (
        value > limit &&
        before !== undefined &&
        value > motionLimits.suddenTimesBefore * before &&
        !jumpSeconds.has(seconds)
      );
    });
    const step = steps[index];
    if (step === undefined) return;
    warnings.push({
      kind: "sudden-change",
      seconds: step.seconds,
      message: `The ${name} part changes suddenly at ${String(step.seconds)} seconds. Look closer there: a hand, a limb, or an object can change its shape or its side, or a door or a light can change.`,
    });
  });
  return warnings;
}

function stillnessWarnings(options: {
  motion: number;
  worldMotion: number;
  cameraMotion: number;
  regions: number[];
}): MotionWarning[] {
  const { motion, worldMotion, regions } = options;
  const largestRegion = Math.max(...regions);
  if (
    motion < motionLimits.stillPercent &&
    largestRegion < motionLimits.stillRegionPercent
  ) {
    return [
      {
        kind: "almost-still",
        message: `The clip is almost a still picture: ${String(rounded(motion))} percent changes in a step.`,
      },
    ];
  }
  if (
    options.cameraMotion >= motionLimits.cameraMovingPercent &&
    worldMotion <
      Math.max(motionLimits.stillPercent, motion * motionLimits.cameraOnlyShare)
  ) {
    return [
      {
        kind: "only-camera-moves",
        message: `Only the camera moves. The world in the picture changes ${String(rounded(worldMotion))} percent in a step after the camera move.`,
      },
    ];
  }
  const stillParts = regionNames.filter(
    (...[, index]) => (regions[index] ?? 0) < motionLimits.stillRegionPercent,
  );
  if (stillParts.length < motionLimits.stillRegionCount) return [];
  const moving = regionNames.filter((name) => !stillParts.includes(name));
  return [
    {
      kind: "still-background",
      message: `${String(stillParts.length)} of 9 parts of the picture hardly move (${stillParts.join(", ")}). Only ${moving.length === 0 ? "nothing" : `the ${moving.join(", ")}`} moves. A living world has wind, light, cloth, hair, or particles that move.`,
    },
  ];
}

function startWarnings(start: StartDifference | undefined): MotionWarning[] {
  if (start === undefined) return [];
  if (start.whole <= motionLimits.startWholePercent) return [];
  return [
    {
      kind: "does-not-start-on-the-start-picture",
      seconds: 0,
      message: `The first frame differs from the start picture by ${String(rounded(start.whole))} percent: it is another picture. The model did not start on the start picture.`,
    },
  ];
}

export function motionWarningsOf(options: {
  steps: MotionStep[];
  motion: number;
  worldMotion: number;
  cameraMotion: number;
  regions: number[];
  start: StartDifference | undefined;
}): MotionWarning[] {
  return [
    ...stillnessWarnings(options),
    ...jumpWarnings(options.steps),
    ...suddenWarnings(options.steps),
    ...startWarnings(options.start),
  ];
}
