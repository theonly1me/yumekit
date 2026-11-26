import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { errorMessage, type Outcome } from "../toolResults.ts";
import type { VideoPlan } from "./videoInput.ts";
import { videoModel } from "./videoModel.ts";

type PictureRole = "first_frame" | "last_frame" | "reference_image";

const pictureTypesByExtension: Partial<Record<string, string>> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

async function pictureItem(options: {
  path: string;
  role: PictureRole;
}): Promise<Outcome<Record<string, unknown>, string>> {
  const { path, role } = options;
  const mimeType = pictureTypesByExtension[extname(path).toLowerCase()];
  if (mimeType === undefined) {
    return { ok: false, failure: `${path} is not a PNG, JPEG, or WebP file.` };
  }
  let bytes: Buffer;
  try {
    bytes = await readFile(path);
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot read ${path}: ${errorMessage(error)}`,
    };
  }
  if (bytes.length >= videoModel.picturesUnderBytes) {
    return {
      ok: false,
      failure: `${path} has ${String(bytes.length)} bytes. Sand AI takes a picture under 30,000,000 bytes.`,
    };
  }
  return {
    ok: true,
    value: {
      type: "image_url",
      role,
      image_url: { url: `data:${mimeType};base64,${bytes.toString("base64")}` },
    },
  };
}

function picturesInOrder(
  plan: VideoPlan,
): { path: string; role: PictureRole }[] {
  const frames = [
    { path: plan.firstFramePath, role: "first_frame" as const },
    { path: plan.lastFramePath, role: "last_frame" as const },
  ].flatMap((frame) =>
    frame.path === undefined ? [] : [{ path: frame.path, role: frame.role }],
  );
  const references = plan.referenceImagePaths.map((path) => ({
    path,
    role: "reference_image" as const,
  }));
  return [...frames, ...references];
}

export async function requestBody(
  plan: VideoPlan,
): Promise<Outcome<string, string>> {
  const pictures: Record<string, unknown>[] = [];
  for (const picture of picturesInOrder(plan)) {
    const item = await pictureItem(picture);
    if (!item.ok) return item;
    pictures.push(item.value);
  }
  const body = JSON.stringify({
    model: videoModel.id,
    content: [{ type: "text", text: plan.prompt }, ...pictures],
    duration: plan.durationSeconds,
    ratio: plan.aspectRatio,
    resolution: videoModel.resolution,
    generate_audio: plan.withAudio,
  });
  const bytes = Buffer.byteLength(body);
  if (bytes > videoModel.maximumBodyBytes) {
    return {
      ok: false,
      failure: `The pictures make a request of ${String(bytes)} bytes. Sand AI takes at most 64,000,000 bytes in one request. Use smaller pictures.`,
    };
  }
  return { ok: true, value: body };
}
