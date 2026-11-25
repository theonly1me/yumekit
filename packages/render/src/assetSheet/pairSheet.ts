import { pictureSourceOf } from "../browser/drawSheet.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import type { StageHost } from "../session/stageHost.js";
import { extractPictures, pickedFramesOf } from "./assetFrames.js";
import { escapeHtml } from "./assetSheetHtml.js";
import { shapeOf, wholePicture } from "./assetSheetLayout.js";
import type { AssetSheet, AssetSheetRequest } from "./drawAssetSheet.js";
import {
  pairGapPixels,
  pairLabelPixels,
  pairLayoutOf,
  type PairLayout,
  type PictureSize,
} from "./pairLayout.js";

export interface BesidePicture {
  file: string;
  title: string;
  widthPixels: number;
  heightPixels: number;
}

function figureHtml(options: {
  png: Uint8Array;
  label: string;
  size: PictureSize;
}): string {
  const { size } = options;
  return `<figure style="width:${String(size.widthPixels)}px"><figcaption>${escapeHtml(options.label)}</figcaption><img src="${pictureSourceOf(options.png)}" alt="" style="width:${String(size.widthPixels)}px;height:${String(size.heightPixels)}px"></figure>`;
}

function pairHtmlOf(options: {
  layout: PairLayout;
  figures: string[];
}): string {
  const style = `
    * { box-sizing: border-box; margin: 0; }
    body { background: #101014; color: #f2f2f6; font: 600 13px/1.2 ui-monospace, Menlo, Consolas, monospace; display: flex; flex-direction: ${options.layout.direction}; align-items: flex-start; gap: ${String(pairGapPixels)}px; padding: ${String(pairGapPixels)}px; }
    figcaption { height: ${String(pairLabelPixels)}px; display: flex; align-items: center; white-space: nowrap; overflow: hidden; }
    img { display: block; background: #000; }
  `;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${style}</style></head><body>${options.figures.join("")}</body></html>`;
}

export async function drawPairSheet(options: {
  host: StageHost;
  request: AssetSheetRequest;
  beside: BesidePicture;
}): Promise<Outcome<AssetSheet, RenderFailure>> {
  const { request, beside } = options;
  const region = request.region ?? wholePicture;
  const picked =
    request.kind === "video"
      ? await pickedFramesOf({ ...request, count: 1 })
      : succeed({ frames: undefined, seconds: [] });
  if (!picked.ok) return picked;
  const layout = pairLayoutOf({
    firstShape: shapeOf({ ...request, region }),
    secondShape: beside.widthPixels / beside.heightPixels,
    firstWidthPixels: request.widthPixels * region.width,
  });
  const crop = await extractPictures({
    file: request.file,
    frameNumbers: picked.value.frames,
    region: request.region,
    cellWidth: layout.first.widthPixels,
  });
  if (!crop.ok) return crop;
  const design = await extractPictures({
    file: beside.file,
    frameNumbers: undefined,
    region: undefined,
    cellWidth: layout.second.widthPixels,
  });
  if (!design.ok) return design;
  const [cropPng] = crop.value;
  const [designPng] = design.value;
  if (cropPng === undefined || designPng === undefined) {
    return fail({
      kind: "media-not-readable",
      file: request.file,
      message: `FFmpeg gave no picture of "${request.file}".`,
      hint: "Check that the file is a complete picture or video file.",
    });
  }
  const { seconds } = picked.value;
  const time = seconds.map((entry) => ` at ${entry.toFixed(2)}s`).join("");
  const picture = await options.host.drawSheet({
    size: layout.size,
    pictureType: "jpeg",
    html: pairHtmlOf({
      layout,
      figures: [
        figureHtml({
          png: cropPng,
          label: `${request.title}${time}`,
          size: layout.first,
        }),
        figureHtml({
          png: designPng,
          label: beside.title,
          size: layout.second,
        }),
      ],
    }),
  });
  return succeed({ picture, ...layout.size, seconds });
}
