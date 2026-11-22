import { easings } from "@yumekit/scene";

export const entryCurve = easings.cubicBezier({
  x1: 0.16,
  y1: 1,
  x2: 0.3,
  y2: 1,
});

export const exitCurve = easings.cubicBezier({
  x1: 0.7,
  y1: 0,
  x2: 0.84,
  y2: 0,
});

export const drawCurve = easings.cubicBezier({
  x1: 0.65,
  y1: 0,
  x2: 0.35,
  y2: 1,
});

export function framesOf(options: {
  seconds: number;
  framesPerSecond: number;
}): number {
  return Math.max(0, options.seconds * options.framesPerSecond);
}
