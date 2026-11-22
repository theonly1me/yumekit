import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { errorMessage, type Outcome } from "./toolResults.ts";

export interface ImagePart {
  type: "image";
  data: string;
  mime_type: string;
}

const imageTypesByExtension: Partial<Record<string, string>> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

async function readImagePart(
  path: string,
): Promise<Outcome<ImagePart, string>> {
  const mimeType = imageTypesByExtension[extname(path).toLowerCase()];
  if (!mimeType) {
    return { ok: false, failure: `${path} is not a PNG, JPEG, or WebP file.` };
  }
  try {
    const bytes = await readFile(path);
    return {
      ok: true,
      value: {
        type: "image",
        data: bytes.toString("base64"),
        mime_type: mimeType,
      },
    };
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot read ${path}: ${errorMessage(error)}`,
    };
  }
}

export async function readImageParts(
  paths: string[],
): Promise<Outcome<ImagePart[], string>> {
  const images: ImagePart[] = [];
  for (const path of paths) {
    const image = await readImagePart(path);
    if (!image.ok) return image;
    images.push(image.value);
  }
  return { ok: true, value: images };
}
