import { falPage } from "../shapes.ts";
import { sizeFields } from "./fields.ts";
import type { ImageModel, ImageRequest } from "./types.ts";

const textEndpoint = "minimax/h3-image/text-to-image";
const editEndpoint = "minimax/h3-image/edit";
const areaPixels = 2048 * 2048;

function sharedFields(request: ImageRequest): Record<string, unknown> {
  return {
    ...sizeFields({ request, areaPixels }),
    num_images: 1,
    output_format: "png",
  };
}

export const minimaxH3Image: ImageModel = {
  id: "minimax/h3-image",
  label: "MiniMax H3 Image",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [falPage(textEndpoint), falPage(editEndpoint)],
  choiceSettings: [],
  transparentBackground: false,
  prices: [],
  textToImage: (request) => ({
    endpointId: textEndpoint,
    fields: sharedFields(request),
  }),
  references: {
    maximum: 16,
    call: (request) => ({
      endpointId: editEndpoint,
      fields: {
        ...sharedFields(request),
        image_urls: request.referenceImageUrls,
      },
    }),
  },
};
