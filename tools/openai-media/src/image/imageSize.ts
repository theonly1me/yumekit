import type { Outcome } from "../toolResults.ts";

const sideStepPixels = 16;
const largestAspectRatio = 3;
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function nearestSide(pixels: number): number {
  return Math.max(
    sideStepPixels,
    Math.round(pixels / sideStepPixels) * sideStepPixels,
  );
}

export function requestedSize(options: {
  widthPixels: number | undefined;
  heightPixels: number | undefined;
}): Outcome<string, string> {
  const { widthPixels, heightPixels } = options;
  if (widthPixels === undefined && heightPixels === undefined) {
    return { ok: true, value: "auto" };
  }
  if (widthPixels === undefined || heightPixels === undefined) {
    return {
      ok: false,
      failure: "Give both width_pixels and height_pixels, or neither.",
    };
  }
  if (
    widthPixels % sideStepPixels !== 0 ||
    heightPixels % sideStepPixels !== 0
  ) {
    const nearestWidth = nearestSide(widthPixels);
    const nearestHeight = nearestSide(heightPixels);
    return {
      ok: false,
      failure: `width_pixels and height_pixels must be multiples of ${String(sideStepPixels)}. The nearest valid size is width_pixels ${String(nearestWidth)} and height_pixels ${String(nearestHeight)}.`,
    };
  }
  const longSide = Math.max(widthPixels, heightPixels);
  const shortSide = Math.min(widthPixels, heightPixels);
  if (longSide > shortSide * largestAspectRatio) {
    return {
      ok: false,
      failure: `The long side can be at most ${String(largestAspectRatio)} times the short side.`,
    };
  }
  return { ok: true, value: `${String(widthPixels)}x${String(heightPixels)}` };
}

export function readPngSize(
  bytes: Buffer,
): { width: number; height: number } | undefined {
  const hasHeader =
    bytes.length >= 24 &&
    bytes.subarray(0, 8).equals(pngSignature) &&
    bytes.toString("ascii", 12, 16) === "IHDR";
  if (!hasHeader) return undefined;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
