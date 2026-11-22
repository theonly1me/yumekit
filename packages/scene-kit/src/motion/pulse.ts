import { framesOf } from "./curves.js";

const defaultAmount = 0.08;
const defaultDurationSeconds = 0.4;

export function pulse(options: {
  frame: number;
  framesPerSecond: number;
  atFrame: number;
  amount?: number;
  durationSeconds?: number;
}): number {
  const durationFrames = framesOf({
    seconds: options.durationSeconds ?? defaultDurationSeconds,
    framesPerSecond: options.framesPerSecond,
  });
  const progress = (options.frame - options.atFrame) / durationFrames;
  if (!(progress > 0 && progress < 1)) {
    return 1;
  }
  return 1 + (options.amount ?? defaultAmount) * Math.sin(Math.PI * progress);
}
