import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import type { SharpenKind } from "../catalog/sharper/index.ts";
import { errorMessage, type Outcome } from "../toolResults.ts";
import { maximumImageBytes, type FrameImage } from "./imageFiles.ts";

export type MediaFile = FrameImage & { kind: SharpenKind };

const mediaTypesByExtension: Partial<
  Record<string, { contentType: string; kind: SharpenKind }>
> = {
  ".png": { contentType: "image/png", kind: "image" },
  ".jpg": { contentType: "image/jpeg", kind: "image" },
  ".jpeg": { contentType: "image/jpeg", kind: "image" },
  ".webp": { contentType: "image/webp", kind: "image" },
  ".mp4": { contentType: "video/mp4", kind: "video" },
  ".mov": { contentType: "video/quicktime", kind: "video" },
  ".webm": { contentType: "video/webm", kind: "video" },
};

export async function readMediaFile(
  path: string,
): Promise<Outcome<MediaFile, string>> {
  const type = mediaTypesByExtension[extname(path).toLowerCase()];
  if (type === undefined) {
    return {
      ok: false,
      failure: `media_path ${path} is not a PNG, JPEG, or WebP picture, or an MP4, MOV, or WebM video.`,
    };
  }
  let bytes: Buffer;
  try {
    bytes = await readFile(path);
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot read media_path ${path}: ${errorMessage(error)}`,
    };
  }
  if (type.kind === "image" && bytes.length > maximumImageBytes) {
    return {
      ok: false,
      failure: `media_path ${path} is larger than 30 MB, the limit of fal for an image.`,
    };
  }
  return {
    ok: true,
    value: { fileName: basename(path), ...type, bytes },
  };
}
