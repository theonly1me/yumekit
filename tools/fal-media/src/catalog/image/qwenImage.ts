import { falPage } from "../shapes.ts";
import { sizeFields } from "./fields.ts";
import type { ImageModel, ImageRequest } from "./types.ts";

const textEndpoint = "alibaba/qwen-image-3/text-to-image";
const editEndpoint = "alibaba/qwen-image-3/edit";
const areaPixels = 1024 * 1024;

function sharedFields(request: ImageRequest): Record<string, unknown> {
  return {
    ...sizeFields({ request, areaPixels }),
    num_images: 1,
    output_format: "png",
  };
}

export const qwenImage3: ImageModel = {
  id: "alibaba/qwen-image-3",
  label: "Qwen Image 3",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [falPage(textEndpoint), falPage(editEndpoint)],
  choiceSettings: [],
  transparentBackground: false,
  prices: [{ usd: 0.04, unit: "image", when: {} }],
  textToImage: (request) => ({
    endpointId: textEndpoint,
    fields: sharedFields(request),
  }),
  references: {
    maximum: 3,
    call: (request) => ({
      endpointId: editEndpoint,
      fields: {
        ...sharedFields(request),
        image_urls: request.referenceImageUrls,
      },
    }),
  },
};
