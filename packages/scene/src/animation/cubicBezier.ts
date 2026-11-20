interface ControlPoints {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const newtonIterations = 8;
const bisectionIterations = 60;
const tolerance = 1e-7;

function bezierCoordinate(options: {
  first: number;
  second: number;
  time: number;
}): number {
  const { first, second, time } = options;
  const remaining = 1 - time;
  return (
    3 * remaining * remaining * time * first +
    3 * remaining * time * time * second +
    time * time * time
  );
}

function bezierSlope(options: {
  first: number;
  second: number;
  time: number;
}): number {
  const { first, second, time } = options;
  const remaining = 1 - time;
  return (
    3 * remaining * remaining * first +
    6 * remaining * time * (second - first) +
    3 * time * time * (1 - second)
  );
}

function findTimeForX(options: {
  controlPoints: ControlPoints;
  progress: number;
}): number {
  const { x1, x2 } = options.controlPoints;
  const xAt = (time: number) =>
    bezierCoordinate({ first: x1, second: x2, time });
  let time = options.progress;
  for (let iteration = 0; iteration < newtonIterations; iteration += 1) {
    const error = xAt(time) - options.progress;
    if (Math.abs(error) < tolerance) {
      return time;
    }
    const slope = bezierSlope({ first: x1, second: x2, time });
    if (Math.abs(slope) < tolerance) {
      break;
    }
    time -= error / slope;
  }
  let low = 0;
  let high = 1;
  time = options.progress;
  for (let iteration = 0; iteration < bisectionIterations; iteration += 1) {
    const error = xAt(time) - options.progress;
    if (Math.abs(error) < tolerance) {
      return time;
    }
    if (error > 0) {
      high = time;
    } else {
      low = time;
    }
    time = (low + high) / 2;
  }
  return time;
}

export function solveCubicBezier(options: {
  controlPoints: ControlPoints;
  progress: number;
}): number {
  const progress = Math.min(Math.max(options.progress, 0), 1);
  const time = findTimeForX({ controlPoints: options.controlPoints, progress });
  const { y1, y2 } = options.controlPoints;
  return bezierCoordinate({ first: y1, second: y2, time });
}
