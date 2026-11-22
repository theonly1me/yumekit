import { sizeForArea } from "../shapes.ts";
import type { ImageRequest } from "./types.ts";

export function sizeFields(options: {
  request: ImageRequest;
  areaPixels: number;
}): Record<string, unknown> {
  return {
    prompt: options.request.prompt,
    image_size: sizeForArea({
      ...options.request,
      areaPixels: options.areaPixels,
    }),
  };
}

export function backgroundField(
  request: ImageRequest,
): Record<string, unknown> {
  return request.transparentBackground ? { background: "transparent" } : {};
}
