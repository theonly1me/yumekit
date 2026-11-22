import { spring, tween } from "@yumekit/scene";
import { entryCurve, exitCurve, framesOf } from "./curves.js";
import { styleOf, type EnterKind, type MotionStyle } from "./motionStyle.js";

export interface EnterOptions {
  frame: number;
  framesPerSecond: number;
  startFrame?: number;
  kind?: EnterKind;
  durationSeconds?: number;
  unit?: number;
  distanceUnits?: number;
  calm?: boolean;
}

export interface ExitOptions extends Omit<EnterOptions, "startFrame"> {
  endFrame: number;
}

const defaultDurationSeconds = 0.6;
const defaultUnit = 10;
const defaultDistanceUnits = 5;
const opacityShareOfDuration = 0.55;
const springsByKind: Partial<
  Record<EnterKind, { stiffness: number; damping: number }>
> = {
  scale: { stiffness: 170, damping: 15 },
  pop: { stiffness: 220, damping: 15 },
};

function kindOf(options: { kind?: EnterKind; calm?: boolean }): EnterKind {
  return options.calm === true ? "fade" : (options.kind ?? "rise");
}

function springProgress(options: {
  frame: number;
  startFrame: number;
  endFrame: number;
  framesPerSecond: number;
  stiffness: number;
  damping: number;
}): number {
  if (options.frame >= options.endFrame) {
    return 1;
  }
  return spring({ ...options, from: 0, to: 1 });
}

export function enter(options: EnterOptions): MotionStyle {
  const kind = kindOf(options);
  const unit = options.unit ?? defaultUnit;
  const startFrame = options.startFrame ?? 0;
  const durationFrames = framesOf({
    seconds: options.durationSeconds ?? defaultDurationSeconds,
    framesPerSecond: options.framesPerSecond,
  });
  const endFrame = startFrame + durationFrames;
  const { frame, framesPerSecond } = options;
  const springSettings = springsByKind[kind];
  const progress =
    springSettings === undefined
      ? tween({
          frame,
          startFrame,
          endFrame,
          from: 0,
          to: 1,
          easing: entryCurve,
        })
      : springProgress({
          frame,
          startFrame,
          endFrame,
          framesPerSecond,
          ...springSettings,
        });
  const opacity = tween({
    frame,
    startFrame,
    endFrame: startFrame + durationFrames * opacityShareOfDuration,
    from: 0,
    to: 1,
    easing: entryCurve,
  });
  return styleOf({
    kind,
    progress,
    opacity,
    unit,
    distancePixels: (options.distanceUnits ?? defaultDistanceUnits) * unit,
  });
}

export function exit(options: ExitOptions): MotionStyle {
  const durationFrames = framesOf({
    seconds: options.durationSeconds ?? defaultDurationSeconds,
    framesPerSecond: options.framesPerSecond,
  });
  const gone = tween({
    frame: options.frame,
    startFrame: options.endFrame - durationFrames,
    endFrame: options.endFrame,
    from: 0,
    to: 1,
    easing: exitCurve,
  });
  const unit = options.unit ?? defaultUnit;
  return styleOf({
    kind: kindOf(options),
    progress: 1 - gone,
    opacity: 1 - gone,
    unit,
    distancePixels: (options.distanceUnits ?? defaultDistanceUnits) * unit,
  });
}
