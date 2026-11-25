import type { AssetMark, AssetRegion } from "@yumekit/project";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import type { StageHost } from "../session/stageHost.js";
import { drawPairSheet, type BesidePicture } from "./pairSheet.js";
import { findFfmpeg } from "../video/findFfmpeg.js";
import { extractPictures, pickedFramesOf } from "./assetFrames.js";
import { assetSheetHtmlOf, assetSheetSizeOf } from "./assetSheetHtml.js";
import {
  assetSheetLayoutOf,
  markBoxesOf,
  markNamesAtCells,
  shapeOf,
  wholePicture,
} from "./assetSheetLayout.js";

export interface AssetSheetRequest {
  file: string;
  title: string;
  kind: "image" | "video";
  widthPixels: number;
  heightPixels: number;
  marks: AssetMark[];
  region?: AssetRegion;
  fromSeconds?: number;
  toSeconds?: number;
  count?: number;
  columns?: number;
  beside?: BesidePicture;
}

export interface AssetSheet {
  picture: Uint8Array;
  widthPixels: number;
  heightPixels: number;
  seconds: number[];
}

export async function drawAssetSheet(options: {
  host: StageHost;
  request: AssetSheetRequest;
}): Promise<Outcome<AssetSheet, RenderFailure>> {
  const { request } = options;
  const missing = await findFfmpeg();
  if (missing !== undefined) return fail(missing);
  if (request.beside !== undefined) {
    return drawPairSheet({
      host: options.host,
      request,
      beside: request.beside,
    });
  }
  const region = request.region ?? wholePicture;
  const picked =
    request.kind === "video"
      ? await pickedFramesOf(request)
      : succeed({ frames: undefined, seconds: [] });
  if (!picked.ok) return picked;
  const layout = assetSheetLayoutOf({
    shape: shapeOf({ ...request, region }),
    count: picked.value.frames?.length ?? 1,
    columns: request.columns,
    widthPixels: request.widthPixels * region.width,
  });
  const pictures = await extractPictures({
    file: request.file,
    frameNumbers: picked.value.frames,
    region: request.region,
    cellWidth: layout.cellWidth,
  });
  if (!pictures.ok) return pictures;
  const { seconds } = picked.value;
  const markNames = markNamesAtCells({ marks: request.marks, seconds });
  const size = assetSheetSizeOf(layout);
  const picture = await options.host.drawSheet({
    size,
    pictureType: "jpeg",
    html: assetSheetHtmlOf({
      layout,
      title: request.title,
      markBoxes: markBoxesOf({ marks: request.marks, region }),
      cells: pictures.value.map((...[png, index]) => {
        const cellSeconds = seconds[index];
        const names = markNames[index] ?? [];
        const time =
          cellSeconds === undefined ? "" : `${cellSeconds.toFixed(2)}s`;
        return {
          png,
          label: [time, ...names.map((name) => `* ${name}`)]
            .filter((part) => part !== "")
            .join("  "),
        };
      }),
    }),
  });
  return succeed({ picture, ...size, seconds });
}
