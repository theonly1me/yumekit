import { easings, type Easing } from "./easings.js";

export function tween(options: {
  frame: number;
  startFrame: number;
  endFrame: number;
  from: number;
  to: number;
  easing?: Easing;
}): number {
  const { frame, startFrame, endFrame, from, to } = options;
  if (frame <= startFrame) {
    return from;
  }
  if (frame >= endFrame) {
    return to;
  }
  const easing = options.easing ?? easings.easeInOut;
  const progress = (frame - startFrame) / (endFrame - startFrame);
  return from + (to - from) * easing(progress);
}
