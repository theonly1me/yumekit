import type { RenderScale } from "../renderFailure.js";

export interface SheetLayout {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  scale: RenderScale;
}

const widestSheetPixels = 1600;
const widestCellPixels = 320;
const sheetShape = 1.6;
const scales: RenderScale[] = [0.25, 0.5, 1];

function columnsOf(options: {
  count: number;
  shape: number;
  columns: number | undefined;
}): number {
  const { count, shape } = options;
  const wanted =
    options.columns ?? Math.round(Math.sqrt((count * sheetShape) / shape));
  return Math.min(Math.max(1, count), Math.max(1, wanted));
}

export function sheetLayoutOf(options: {
  output: { widthPixels: number; heightPixels: number };
  count: number;
  columns?: number;
}): SheetLayout {
  const { output, count } = options;
  const shape = output.widthPixels / output.heightPixels;
  const columns = columnsOf({ count, shape, columns: options.columns });
  const cellWidth = Math.min(
    widestCellPixels,
    Math.floor(widestSheetPixels / columns),
  );
  const scale =
    scales.find((candidate) => output.widthPixels * candidate >= cellWidth) ??
    1;
  return {
    columns,
    rows: Math.ceil(count / columns),
    cellWidth,
    cellHeight: Math.round(cellWidth / shape),
    scale,
  };
}
