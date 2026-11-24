import { measureSize } from "./grayFrames.js";
import { percentOf } from "./percentOf.js";

export const gridSize = 3;

const border = 6;

const largestShift = 4;

const zooms = [0.97, 0.985, 1, 1.015, 1.03];

export interface CameraFit {
  shiftX: number;
  shiftY: number;
  zoom: number;
  motion: number;
  worldMotion: number;
  regions: number[];
}

interface Placement {
  shiftX: number;
  shiftY: number;
  zoom: number;
}

const still: Placement = { shiftX: 0, shiftY: 0, zoom: 1 };

function regionOf(options: { row: number; column: number }): number {
  const { width, height } = measureSize;
  const gridRow = Math.min(
    gridSize - 1,
    Math.floor((options.row * gridSize) / height),
  );
  const gridColumn = Math.min(
    gridSize - 1,
    Math.floor((options.column * gridSize) / width),
  );
  return gridRow * gridSize + gridColumn;
}

function differenceOf(options: {
  before: Uint8Array;
  after: Uint8Array;
  placement: Placement;
  byRegion: boolean;
}): { whole: number; regions: number[] } {
  const { before, after, placement } = options;
  const { width, height } = measureSize;
  const centerX = width / 2;
  const centerY = height / 2;
  const sums = new Array<number>(gridSize * gridSize).fill(0);
  const counts = new Array<number>(gridSize * gridSize).fill(0);
  let sum = 0;
  let count = 0;
  for (let row = border; row < height - border; row += 1) {
    const sampleRow = Math.round(
      (row - centerY) * placement.zoom + centerY + placement.shiftY,
    );
    if (sampleRow < 0 || sampleRow >= height) continue;
    for (let column = border; column < width - border; column += 1) {
      const sampleColumn = Math.round(
        (column - centerX) * placement.zoom + centerX + placement.shiftX,
      );
      if (sampleColumn < 0 || sampleColumn >= width) continue;
      const change = Math.abs(
        (before[row * width + column] ?? 0) -
          (after[sampleRow * width + sampleColumn] ?? 0),
      );
      sum += change;
      count += 1;
      if (options.byRegion) {
        const region = regionOf({ row, column });
        sums[region] = (sums[region] ?? 0) + change;
        counts[region] = (counts[region] ?? 0) + 1;
      }
    }
  }
  return {
    whole: percentOf({ total: sum, count }),
    regions: sums.map((...[total, index]) =>
      percentOf({ total, count: counts[index] ?? 0 }),
    ),
  };
}

function bestOf(options: {
  before: Uint8Array;
  after: Uint8Array;
  candidates: Placement[];
}): { placement: Placement; whole: number } {
  let best = { placement: still, whole: Number.POSITIVE_INFINITY };
  for (const placement of options.candidates) {
    const { whole } = differenceOf({ ...options, placement, byRegion: false });
    if (whole < best.whole) best = { placement, whole };
  }
  return best;
}

function shiftsAround(options: {
  centerX: number;
  centerY: number;
  reach: number;
  zoom: number;
}): Placement[] {
  const placements: Placement[] = [];
  for (let shiftY = -options.reach; shiftY <= options.reach; shiftY += 1) {
    for (let shiftX = -options.reach; shiftX <= options.reach; shiftX += 1) {
      placements.push({
        shiftX: options.centerX + shiftX,
        shiftY: options.centerY + shiftY,
        zoom: options.zoom,
      });
    }
  }
  return placements;
}

export function cameraFitOf(options: {
  before: Uint8Array;
  after: Uint8Array;
}): CameraFit {
  const shifted = bestOf({
    ...options,
    candidates: shiftsAround({
      centerX: 0,
      centerY: 0,
      reach: largestShift,
      zoom: 1,
    }),
  });
  const zoomed = bestOf({
    ...options,
    candidates: zooms.flatMap((zoom) =>
      shiftsAround({
        centerX: shifted.placement.shiftX,
        centerY: shifted.placement.shiftY,
        reach: 1,
        zoom,
      }),
    ),
  });
  const raw = differenceOf({ ...options, placement: still, byRegion: false });
  const fitted = differenceOf({
    ...options,
    placement: zoomed.placement,
    byRegion: true,
  });
  return {
    ...zoomed.placement,
    motion: raw.whole,
    worldMotion: Math.min(raw.whole, fitted.whole),
    regions: fitted.regions,
  };
}
