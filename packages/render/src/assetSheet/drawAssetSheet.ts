import type { AssetMark, AssetRegion } from "@yumekit/project";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import type { StageHost } from "../session/stageHost.js";
import { findFfmpeg } from "../video/findFfmpeg.js";
import { extractPictures, videoTimingOf } from "./assetFrames.js";
import { assetSheetHtmlOf, assetSheetSizeOf } from "./assetSheetHtml.js";
import {
  assetSheetLayoutOf,
  markBoxesOf,
  markNamesAtCells,
  pickedSecondsOf,
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
}

export interface AssetSheet {
  picture: Uint8Array;
  widthPixels: number;
  heightPixels: number;
  seconds: number[];
}

const defaultCount = 12;

function roundSeconds(seconds: number): number {
  return Math.round(seconds * 100) / 100;
}

async function pickedFrames(
  request: AssetSheetRequest,
): Promise<Outcome<{ frames: number[]; seconds: number[] }, RenderFailure>> {
  const timing = await videoTimingOf(request.file);
  if (timing === undefined || timing.frameCount === 0) {
    return fail({
      kind: "media-not-readable",
      file: request.file,
      message: `FFprobe cannot read the length of "${request.file}".`,
      hint: "Check that the file is a complete video file.",
    });
  }
  const lengthSeconds = timing.frameCount / timing.framesPerSecond;
  const fromSeconds = Math.min(request.fromSeconds ?? 0, lengthSeconds);
  const toSeconds = Math.min(request.toSeconds ?? lengthSeconds, lengthSeconds);
  const picked = pickedSecondsOf({
    fromSeconds,
    toSeconds: Math.max(toSeconds, fromSeconds),
    count: request.count ?? defaultCount,
  });
  const frames = [
    ...new Set(
      picked.map((seconds) =>
        Math.min(
          timing.frameCount - 1,
          Math.round(seconds * timing.framesPerSecond),
        ),
      ),
    ),
  ];
  return succeed({
    frames,
    seconds: frames.map((frame) =>
      roundSeconds(frame / timing.framesPerSecond),
    ),
  });
}

export async function drawAssetSheet(options: {
  host: StageHost;
  request: AssetSheetRequest;
}): Promise<Outcome<AssetSheet, RenderFailure>> {
  const { request } = options;
  const missing = await findFfmpeg();
  if (missing !== undefined) return fail(missing);
  const region = request.region ?? wholePicture;
  const picked =
    request.kind === "video"
      ? await pickedFrames(request)
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
