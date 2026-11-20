import { solveCubicBezier } from "./cubicBezier.js";

export type Easing = (progress: number) => number;

function cubicBezier(controlPoints: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}): Easing {
  return (progress) => solveCubicBezier({ controlPoints, progress });
}

export const easings: {
  linear: Easing;
  easeIn: Easing;
  easeOut: Easing;
  easeInOut: Easing;
  cubicBezier: typeof cubicBezier;
} = {
  linear: (progress) => progress,
  easeIn: cubicBezier({ x1: 0.42, y1: 0, x2: 1, y2: 1 }),
  easeOut: cubicBezier({ x1: 0, y1: 0, x2: 0.58, y2: 1 }),
  easeInOut: cubicBezier({ x1: 0.42, y1: 0, x2: 0.58, y2: 1 }),
  cubicBezier,
};
