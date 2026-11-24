import type { Outcome } from "../toolResults.ts";

export type Shape = "landscape" | "portrait" | "square";

export interface PictureSize {
  width: number;
  height: number;
}

const squareTolerance = 1.1;
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function shapeOf(size: PictureSize): Shape {
  const ratio = size.width / size.height;
  if (ratio > squareTolerance) return "landscape";
  if (ratio < 1 / squareTolerance) return "portrait";
  return "square";
}

export function askedSizeOf(options: {
  widthPixels: number | undefined;
  heightPixels: number | undefined;
}): Outcome<PictureSize | undefined, string> {
  const { widthPixels, heightPixels } = options;
  if (widthPixels === undefined && heightPixels === undefined) {
    return { ok: true, value: undefined };
  }
  if (widthPixels === undefined || heightPixels === undefined) {
    return {
      ok: false,
      failure: "Give both width_pixels and height_pixels, or neither.",
    };
  }
  return { ok: true, value: { width: widthPixels, height: heightPixels } };
}

export function readPngSize(bytes: Buffer): PictureSize | undefined {
  const hasHeader =
    bytes.length >= 24 &&
    bytes.subarray(0, 8).equals(pngSignature) &&
    bytes.toString("ascii", 12, 16) === "IHDR";
  if (!hasHeader) return undefined;
  const size = {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
  return size.width > 0 && size.height > 0 ? size : undefined;
}

export function checkShape(options: {
  asked: PictureSize | undefined;
  made: PictureSize;
}): Outcome<true, string> {
  const { asked, made } = options;
  if (asked === undefined) return { ok: true, value: true };
  const askedShape = shapeOf(asked);
  const madeShape = shapeOf(made);
  if (askedShape === madeShape) return { ok: true, value: true };
  return {
    ok: false,
    failure: `Codex made a ${madeShape} picture of ${String(made.width)} by ${String(made.height)} pixels, not the asked ${askedShape} shape of ${String(asked.width)} by ${String(asked.height)}. yumekit did not keep it. Ask again, or pick another picture service for an exact size.`,
  };
}
