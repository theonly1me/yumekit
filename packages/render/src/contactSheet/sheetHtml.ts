import { pictureSourceOf } from "../browser/drawSheet.js";
import type { SheetLayout } from "./sheetLayout.js";

export interface SheetCell {
  png: Uint8Array;
  label: string;
  isFlagged: boolean;
}

export const sheetHeaderPixels = 30;
export const sheetLabelPixels = 22;
export const sheetGapPixels = 4;

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cellHtml(cell: SheetCell): string {
  return `<figure class="${cell.isFlagged ? "flagged" : ""}"><img src="${pictureSourceOf(cell.png)}" alt=""><figcaption>${escapeHtml(cell.label)}</figcaption></figure>`;
}

export function sheetSizeOf(layout: SheetLayout): {
  widthPixels: number;
  heightPixels: number;
} {
  return {
    widthPixels:
      layout.columns * layout.cellWidth + (layout.columns + 1) * sheetGapPixels,
    heightPixels:
      sheetHeaderPixels +
      layout.rows * (layout.cellHeight + sheetLabelPixels + sheetGapPixels) +
      sheetGapPixels,
  };
}

export function sheetHtmlOf(options: {
  layout: SheetLayout;
  title: string;
  cells: SheetCell[];
}): string {
  const { layout } = options;
  const style = `
    * { box-sizing: border-box; margin: 0; }
    body { background: #101014; color: #d8d8e0; font: 500 12px/1.2 ui-monospace, Menlo, Consolas, monospace; padding: 0 ${String(sheetGapPixels)}px ${String(sheetGapPixels)}px; }
    header { height: ${String(sheetHeaderPixels)}px; display: flex; align-items: center; padding: 0 2px; color: #f2f2f6; font-weight: 600; }
    main { display: grid; grid-template-columns: repeat(${String(layout.columns)}, ${String(layout.cellWidth)}px); gap: ${String(sheetGapPixels)}px; }
    figure { position: relative; }
    img { display: block; width: ${String(layout.cellWidth)}px; height: ${String(layout.cellHeight)}px; background: #000; }
    figcaption { height: ${String(sheetLabelPixels)}px; display: flex; align-items: center; padding: 0 2px; white-space: nowrap; overflow: hidden; }
    figure.flagged img { outline: 3px solid #ff5a5f; outline-offset: -3px; }
    figure.flagged figcaption { color: #ff8a8d; }
    figure.flagged figcaption::before { content: "! "; font-weight: 800; }
  `;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${style}</style></head><body><header>${escapeHtml(options.title)}</header><main>${options.cells.map(cellHtml).join("")}</main></body></html>`;
}
