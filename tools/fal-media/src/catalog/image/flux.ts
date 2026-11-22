import { falPage, nearestAspectRatio } from "../shapes.ts";
import type { ImageModel, ImageRequest } from "./types.ts";

const textEndpoint = "blackforestlabs/flux-3/text-to-image";
const editEndpoint = "blackforestlabs/flux-3/edit-image";

const aspectRatios = [
  "21:9",
  "2:1",
  "16:9",
  "3:2",
  "7:5",
  "4:3",
  "5:4",
  "1:1",
  "4:5",
  "3:4",
  "5:7",
  "2:3",
  "9:16",
  "1:2",
];

function sharedFields(request: ImageRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    aspect_ratio: nearestAspectRatio({ ...request, ratios: aspectRatios }),
    resolution: request.choices.resolution,
    output_format: "png",
  };
}

export const fluxImage: ImageModel = {
  id: "blackforestlabs/flux-3/image",
  label: "FLUX 3",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [falPage(textEndpoint), falPage(editEndpoint)],
  choiceSettings: [
    {
      name: "resolution",
      label: "Resolution",
      choices: ["1k", "1.5k", "2k", "4k"],
      default: "1k",
    },
  ],
  transparentBackground: false,
  prices: [{ usd: 0.048, unit: "image", when: { resolution: "1k" } }],
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
