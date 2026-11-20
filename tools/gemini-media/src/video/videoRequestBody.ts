import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { errorMessage, type Outcome } from "../toolResults.ts";
import type { VideoPlan } from "./videoInput.ts";

interface ImagePart {
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

function imagePathsInOrder(plan: VideoPlan): string[] {
  const frames = [plan.firstFramePath, plan.lastFramePath].filter(
    (path) => path !== undefined,
  );
  return [...frames, ...plan.referenceImagePaths];
}

function taskOf(plan: VideoPlan): Record<string, unknown> {
  const isFramesOnly =
    plan.firstFramePath !== undefined && plan.referenceImagePaths.length === 0;
  if (!isFramesOnly) return {};
  return { generation_config: { video_config: { task: "image_to_video" } } };
}

export async function videoRequestBody(
  plan: VideoPlan,
): Promise<Outcome<Record<string, unknown>, string>> {
  const images: ImagePart[] = [];
  for (const path of imagePathsInOrder(plan)) {
    const image = await readImagePart(path);
    if (!image.ok) return image;
    images.push(image.value);
  }
  const input =
    images.length === 0
      ? plan.prompt
      : [...images, { type: "text", text: plan.prompt }];
  return {
    ok: true,
    value: {
      model: plan.model,
      input,
      response_format: {
        type: "video",
        aspect_ratio: plan.aspectRatio,
        resolution: plan.resolution,
        duration: `${String(plan.durationSeconds)}s`,
      },
      background: true,
      ...taskOf(plan),
    },
  };
}
