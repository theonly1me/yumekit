import type { AssetMark, AssetRegion } from "@yumekit/project";

export interface AssetSheetLayout {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
}

const widestSheetPixels = 1600;
const widestVideoCellPixels = 480;
const highestPicturePixels = 1200;
const sheetShape = 1.6;

export const wholePicture: AssetRegion = { x: 0, y: 0, width: 1, height: 1 };

export function shapeOf(options: {
  widthPixels: number;
  heightPixels: number;
  region: AssetRegion;
}): number {
  const { region } = options;
  return (
    (options.widthPixels * region.width) /
    (options.heightPixels * region.height)
  );
}

export function assetSheetLayoutOf(options: {
  shape: number;
  count: number;
  columns: number | undefined;
  widthPixels: number;
}): AssetSheetLayout {
  const { shape, count } = options;
  if (count === 1) {
    const cellWidth = Math.floor(
      Math.min(
        widestSheetPixels,
        options.widthPixels,
        highestPicturePixels * shape,
      ),
    );
    return {
      columns: 1,
      rows: 1,
      cellWidth,
      cellHeight: Math.round(cellWidth / shape),
    };
  }
  const wanted =
    options.columns ?? Math.round(Math.sqrt((count * sheetShape) / shape));
  const columns = Math.min(Math.max(1, count), Math.max(1, wanted));
  const cellWidth = Math.min(
    widestVideoCellPixels,
    Math.floor(widestSheetPixels / columns),
  );
  return {
    columns,
    rows: Math.ceil(count / columns),
    cellWidth,
    cellHeight: Math.round(cellWidth / shape),
  };
}

export function pickedSecondsOf(options: {
  fromSeconds: number;
  toSeconds: number;
  count: number;
}): number[] {
  const step = (options.toSeconds - options.fromSeconds) / options.count;
  return Array.from(
    { length: options.count },
    (...[, index]) => options.fromSeconds + index * step,
  );
}

export interface MarkBox {
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

export function markBoxesOf(options: {
  marks: AssetMark[];
  region: AssetRegion;
}): MarkBox[] {
  const { region } = options;
  return options.marks.flatMap((mark) => {
    if (mark.region === undefined) return [];
    const left = (mark.region.x - region.x) / region.width;
    const top = (mark.region.y - region.y) / region.height;
    const width = mark.region.width / region.width;
    const height = mark.region.height / region.height;
    const isOutside =
      left >= 1 || top >= 1 || left + width <= 0 || top + height <= 0;
    return isOutside ? [] : [{ name: mark.name, left, top, width, height }];
  });
}

export function markNamesAtCells(options: {
  marks: AssetMark[];
  seconds: number[];
}): string[][] {
  const names = options.seconds.map((): string[] => []);
  for (const mark of options.marks) {
    if (mark.seconds === undefined) continue;
    const markSeconds = mark.seconds;
    let nearest = -1;
    let nearestDistance = Number.POSITIVE_INFINITY;
    options.seconds.forEach((...[cellSeconds, index]) => {
      const distance = Math.abs(cellSeconds - markSeconds);
      if (cellSeconds <= markSeconds + 0.05 && distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
    });
    names[nearest]?.push(mark.name);
  }
  return names;
}
