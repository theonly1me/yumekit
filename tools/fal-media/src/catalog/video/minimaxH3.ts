import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

const textEndpoint = "minimax/h3/text-to-video";
const imageEndpoint = "minimax/h3/image-to-video";
const referenceEndpoint = "minimax/h3/reference-to-video";

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: request.durationSeconds,
    resolution: request.resolution,
  };
}

export const minimaxH3: VideoModel = {
  id: "minimax/h3",
  label: "MiniMax H3",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [
    falPage(textEndpoint),
    falPage(imageEndpoint),
    falPage(referenceEndpoint),
  ],
  durationSeconds: { minimum: 5, maximum: 15, default: 5 },
  resolutions: ["480P", "768P", "2K", "4K"],
  defaultResolution: "2K",
  aspectRatios: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
  sound: "always",
  prices: perSecondByResolution({
    "480P": 0.05,
    "768P": 0.06,
    "2K": 0.13,
    "4K": 0.16,
  }),
  textToVideo: (request) => ({
    endpointId: textEndpoint,
    fields: { ...sharedFields(request), aspect_ratio: request.aspectRatio },
  }),
  firstFrame: {
    acceptsLastFrame: true,
    call: (request) => ({
      endpointId: imageEndpoint,
      fields: {
        ...sharedFields(request),
        image_url: request.firstFrameUrl,
        ...(request.lastFrameUrl === undefined
          ? {}
          : { end_image_url: request.lastFrameUrl }),
      },
    }),
  },
  references: {
    maximum: 9,
    call: (request) => ({
      endpointId: referenceEndpoint,
      fields: {
        ...sharedFields(request),
        aspect_ratio: request.aspectRatio,
        reference_image_urls: request.referenceImageUrls,
      },
    }),
  },
};
