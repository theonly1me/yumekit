import { falPage, nearestAspectRatio } from "../shapes.ts";
import type { ImageModel, ImageRequest } from "./types.ts";

const textEndpoint = "google/nano-banana-2.1";
const editEndpoint = "google/nano-banana-2.1/edit";

const aspectRatios = [
  "21:9",
  "16:9",
  "3:2",
  "4:3",
  "5:4",
  "1:1",
  "4:5",
  "3:4",
  "2:3",
  "9:16",
  "4:1",
  "1:4",
  "8:1",
  "1:8",
];

function sharedFields(request: ImageRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    aspect_ratio: nearestAspectRatio({ ...request, ratios: aspectRatios }),
    resolution: request.choices.resolution,
    num_images: 1,
    output_format: "png",
  };
}

export const nanoBanana21: ImageModel = {
  id: "google/nano-banana-2.1",
  label: "Nano Banana 2.1",
  isDefault: false,
  readOn: "2026-11-24",
  tested: false,
  sources: [falPage(textEndpoint), falPage(editEndpoint)],
  choiceSettings: [
    {
      name: "resolution",
      label: "Resolution",
      choices: ["1K", "2K", "4K"],
      default: "1K",
    },
  ],
  transparentBackground: false,
  prices: [
    { usd: 0.04, unit: "image", when: { resolution: "1K" } },
    { usd: 0.059, unit: "image", when: { resolution: "2K" } },
    { usd: 0.134, unit: "image", when: { resolution: "4K" } },
  ],
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
