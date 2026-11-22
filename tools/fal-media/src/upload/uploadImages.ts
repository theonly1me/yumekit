import type { SendRequest } from "../falApi.ts";
import type { Outcome } from "../toolResults.ts";
import {
  readFrameImage,
  uploadFrameImage,
  type FrameImage,
} from "./imageFiles.ts";

export interface NamedImage {
  field: string;
  image: FrameImage;
}

export async function readImages(
  paths: readonly { field: string; path: string }[],
): Promise<Outcome<NamedImage[], string>> {
  const images: NamedImage[] = [];
  for (const entry of paths) {
    const read = await readFrameImage(entry);
    if (!read.ok) return read;
    images.push({ field: entry.field, image: read.value });
  }
  return { ok: true, value: images };
}

export async function uploadImages(options: {
  images: readonly NamedImage[];
  sendRequest: SendRequest;
  apiKey: string;
}): Promise<Outcome<string[], string>> {
  const urls: string[] = [];
  for (const entry of options.images) {
    const uploaded = await uploadFrameImage({ ...options, image: entry.image });
    if (!uploaded.ok) {
      return {
        ok: false,
        failure: `Cannot upload ${entry.field}: ${uploaded.failure.message}`,
      };
    }
    urls.push(uploaded.value);
  }
  return { ok: true, value: urls };
}

export function pathEntries(options: {
  field: string;
  paths: readonly string[];
}): { field: string; path: string }[] {
  return options.paths.map((path) => ({ field: options.field, path }));
}
