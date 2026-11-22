import { readImageParts } from "../imageParts.ts";
import type { Outcome } from "../toolResults.ts";
import type { ImagePlan } from "./imageInput.ts";

export async function imageRequestBody(
  plan: ImagePlan,
): Promise<Outcome<Record<string, unknown>, string>> {
  const images = await readImageParts(plan.referenceImagePaths);
  if (!images.ok) return images;
  return {
    ok: true,
    value: {
      model: plan.model.id,
      input: [{ type: "text", text: plan.prompt }, ...images.value],
      response_format: {
        type: "image",
        ...(plan.aspectRatio === undefined
          ? {}
          : { aspect_ratio: plan.aspectRatio }),
        ...(plan.imageSize === undefined ? {} : { image_size: plan.imageSize }),
      },
    },
  };
}
