import { tween } from "@yumekit/scene";
import { drawCurve, framesOf } from "./curves.js";

const defaultDurationSeconds = 0.7;

export function draw(options: {
  frame: number;
  framesPerSecond: number;
  startFrame?: number;
  durationSeconds?: number;
}): number {
  const startFrame = options.startFrame ?? 0;
  return tween({
    frame: options.frame,
    startFrame,
    endFrame:
      startFrame +
      framesOf({
        seconds: options.durationSeconds ?? defaultDurationSeconds,
        framesPerSecond: options.framesPerSecond,
      }),
    from: 0,
    to: 1,
    easing: drawCurve,
  });
}
