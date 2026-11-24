import { pictureSourceOf } from "../browser/drawSheet.js";
import type { AssetSheetLayout, MarkBox } from "./assetSheetLayout.js";

export interface AssetSheetCell {
  png: Uint8Array;
  label: string;
}

const headerPixels = 30;
const labelPixels = 22;
const gapPixels = 4;

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function percent(share: number): string {
  return `${String(Math.round(share * 10000) / 100)}%`;
}

function markHtml(box: MarkBox): string {
  return `<i style="left:${percent(box.left)};top:${percent(box.top)};width:${percent(box.width)};height:${percent(box.height)}"><b>${escapeHtml(box.name)}</b></i>`;
}

function cellHtml(options: {
  cell: AssetSheetCell;
  markBoxes: string;
}): string {
  const { cell } = options;
  return `<figure><div class="picture"><img src="${pictureSourceOf(cell.png)}" alt="">${options.markBoxes}</div><figcaption>${escapeHtml(cell.label)}</figcaption></figure>`;
}

export function assetSheetSizeOf(layout: AssetSheetLayout): {
  widthPixels: number;
  heightPixels: number;
} {
  return {
    widthPixels:
      layout.columns * layout.cellWidth + (layout.columns + 1) * gapPixels,
    heightPixels:
      headerPixels +
      layout.rows * (layout.cellHeight + labelPixels + gapPixels) +
      gapPixels,
  };
}

export function assetSheetHtmlOf(options: {
  layout: AssetSheetLayout;
  title: string;
  cells: AssetSheetCell[];
  markBoxes: MarkBox[];
}): string {
  const { layout } = options;
  const markBoxes = options.markBoxes.map(markHtml).join("");
  const style = `
    * { box-sizing: border-box; margin: 0; }
    body { background: #101014; color: #d8d8e0; font: 500 12px/1.2 ui-monospace, Menlo, Consolas, monospace; padding: 0 ${String(gapPixels)}px ${String(gapPixels)}px; }
    header { height: ${String(headerPixels)}px; display: flex; align-items: center; padding: 0 2px; color: #f2f2f6; font-weight: 600; white-space: nowrap; overflow: hidden; }
    main { display: grid; grid-template-columns: repeat(${String(layout.columns)}, ${String(layout.cellWidth)}px); gap: ${String(gapPixels)}px; }
    .picture { position: relative; width: ${String(layout.cellWidth)}px; height: ${String(layout.cellHeight)}px; overflow: hidden; background: #000; }
    img { display: block; width: 100%; height: 100%; }
    i { position: absolute; border: 2px dashed #ffd24a; }
    b { position: absolute; left: 0; top: 0; background: #ffd24a; color: #101014; font: 600 11px/1.3 ui-monospace, Menlo, monospace; padding: 0 3px; white-space: nowrap; }
    figcaption { height: ${String(labelPixels)}px; display: flex; align-items: center; padding: 0 2px; white-space: nowrap; overflow: hidden; }
  `;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${style}</style></head><body><header>${escapeHtml(options.title)}</header><main>${options.cells.map((cell) => cellHtml({ cell, markBoxes })).join("")}</main></body></html>`;
}
