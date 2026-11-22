import { falPage } from "../shapes.ts";
import { sizeFields } from "./fields.ts";
import type { ImageModel, ImageRequest } from "./types.ts";

const textEndpoint = "krea/v3/text-to-image";
const editEndpoint = "krea/v3/edit";
const areaPixels = 1024 * 1024;
const usdForOneMegapixel = 0.025;

function sharedFields(request: ImageRequest): Record<string, unknown> {
  return { ...sizeFields({ request, areaPixels }), output_format: "png" };
}

export const krea3: ImageModel = {
  id: "krea/v3",
  label: "Krea 3",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [falPage(textEndpoint), falPage(editEndpoint)],
  choiceSettings: [],
  transparentBackground: false,
  prices: [{ usd: usdForOneMegapixel, unit: "image", when: {} }],
  usdForEachReferenceImage: usdForOneMegapixel,
  textToImage: (request) => ({
    endpointId: textEndpoint,
    fields: sharedFields(request),
  }),
  references: {
    maximum: 8,
    call: (request) => ({
      endpointId: editEndpoint,
      fields: {
        ...sharedFields(request),
        image_urls: request.referenceImageUrls,
      },
    }),
  },
};
