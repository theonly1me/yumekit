import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

const textEndpoint = "alibaba/happy-horse/v1.1/text-to-video";
const imageEndpoint = "alibaba/happy-horse/v1.1/image-to-video";

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: request.durationSeconds,
    resolution: request.resolution,
  };
}

export const happyHorse11: VideoModel = {
  id: "alibaba/happy-horse/v1.1",
  label: "Happy Horse 1.1",
  isDefault: false,
  readOn: "2026-11-26",
  tested: false,
  sources: [falPage(textEndpoint), falPage(imageEndpoint)],
  durationSeconds: { minimum: 3, maximum: 15, default: 5 },
  resolutions: ["720p", "1080p"],
  defaultResolution: "1080p",
  aspectRatios: [
    "21:9",
    "16:9",
    "4:3",
    "5:4",
    "1:1",
    "4:5",
    "3:4",
    "9:16",
    "9:21",
  ],
  sound: "always",
  prices: perSecondByResolution({ "720p": 0.14, "1080p": 0.18 }),
  textToVideo: (request) => ({
    endpointId: textEndpoint,
    fields: { ...sharedFields(request), aspect_ratio: request.aspectRatio },
  }),
  firstFrame: {
    acceptsLastFrame: false,
    call: (request) => ({
      endpointId: imageEndpoint,
      fields: { ...sharedFields(request), image_url: request.firstFrameUrl },
    }),
  },
};
