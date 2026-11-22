import { readImageParts } from "../imageParts.ts";
import type { Outcome } from "../toolResults.ts";
import type { VideoPlan } from "./videoInput.ts";

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
  const images = await readImageParts(imagePathsInOrder(plan));
  if (!images.ok) return images;
  const input =
    images.value.length === 0
      ? plan.prompt
      : [...images.value, { type: "text", text: plan.prompt }];
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
