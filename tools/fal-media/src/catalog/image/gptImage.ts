import { falPage } from "../shapes.ts";
import { backgroundField, sizeFields } from "./fields.ts";
import type { ImageModel, ImageRequest } from "./types.ts";

const textEndpoint = "openai/gpt-image-2.6/flare/text-to-image";
const editEndpoint = "openai/gpt-image-2.6/flare/edit";
const areaPixels = 1_572_864;

function sharedFields(request: ImageRequest): Record<string, unknown> {
  return {
    ...sizeFields({ request, areaPixels }),
    ...backgroundField(request),
    quality: request.choices.quality,
    num_images: 1,
    output_format: "png",
  };
}

export const gptImageFlare: ImageModel = {
  id: "openai/gpt-image-2.6/flare",
  label: "GPT Image 2.6 Flare",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [falPage(textEndpoint), falPage(editEndpoint)],
  choiceSettings: [
    {
      name: "quality",
      label: "Quality",
      choices: ["auto", "low", "medium", "high", "xhigh", "max"],
      default: "high",
    },
  ],
  transparentBackground: true,
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
