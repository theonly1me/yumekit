import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

const textEndpoint = "google/gemini-omni-flash/v1.2/text-to-video";
const imageEndpoint = "google/gemini-omni-flash/v1.2/image-to-video";
const referenceEndpoint = "google/gemini-omni-flash/v1.2/reference-to-video";

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: request.durationSeconds,
    resolution: request.resolution,
    aspect_ratio: request.aspectRatio,
  };
}

export const geminiOmniFlash: VideoModel = {
  id: "google/gemini-omni-flash/v1.2",
  label: "Gemini Omni Flash 1.2",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [
    falPage(textEndpoint),
    falPage(imageEndpoint),
    falPage(referenceEndpoint),
  ],
  durationSeconds: { minimum: 3, maximum: 15, default: 8 },
  resolutions: ["360p", "720p", "1080p", "4k"],
  defaultResolution: "720p",
  aspectRatios: ["16:9", "9:16"],
  sound: "always",
  prices: perSecondByResolution({
    "360p": 0.0273,
    "720p": 0.0819,
    "1080p": 0.1229,
    "4k": 0.2457,
  }),
  textToVideo: (request) => ({
    endpointId: textEndpoint,
    fields: sharedFields(request),
  }),
  firstFrame: {
    acceptsLastFrame: true,
    lastFrameMaximumSeconds: 10,
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
    maximum: 10,
    call: (request) => ({
      endpointId: referenceEndpoint,
      fields: {
        ...sharedFields(request),
        image_urls: request.referenceImageUrls,
      },
    }),
  },
};
