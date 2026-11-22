import { falPage } from "../shapes.ts";
import { backgroundField, sizeFields } from "./fields.ts";
import type { ImageModel, ImageRequest } from "./types.ts";

const textEndpoint = "bytedance/seedream/v5.5/text-to-image";
const editEndpoint = "bytedance/seedream/v5.5/edit";
const areaPixels = 2_560_000;

function sharedFields(request: ImageRequest): Record<string, unknown> {
  return {
    ...sizeFields({ request, areaPixels }),
    ...backgroundField(request),
    num_images: 1,
    output_format: "png",
  };
}

export const seedream55: ImageModel = {
  id: "bytedance/seedream/v5.5",
  label: "Seedream 5.5",
  isDefault: true,
  readOn: "2026-11-22",
  tested: false,
  sources: [falPage(textEndpoint), falPage(editEndpoint)],
  choiceSettings: [],
  transparentBackground: true,
  prices: [{ usd: 0.03, unit: "image", when: {} }],
  usdForEachReferenceImage: 0.012,
  textToImage: (request) => ({
    endpointId: textEndpoint,
    fields: sharedFields(request),
  }),
  references: {
    maximum: 10,
    call: (request) => ({
      endpointId: editEndpoint,
      fields: {
        ...sharedFields(request),
        image_urls: request.referenceImageUrls,
      },
    }),
  },
};
