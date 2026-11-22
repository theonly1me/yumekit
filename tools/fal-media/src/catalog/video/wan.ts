import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

const textEndpoint = "alibaba/wan-3.0/text-to-video";
const imageEndpoint = "alibaba/wan-3.0/image-to-video";

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: request.durationSeconds,
    resolution: request.resolution,
    audio: request.withAudio,
  };
}

export const wan30: VideoModel = {
  id: "alibaba/wan-3.0",
  label: "Wan 3.0",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [falPage(textEndpoint), falPage(imageEndpoint)],
  durationSeconds: { minimum: 2, maximum: 30, default: 5 },
  resolutions: ["480p", "720p", "1080p"],
  defaultResolution: "1080p",
  aspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16"],
  sound: "switch",
  prices: perSecondByResolution({ "480p": 0.05, "720p": 0.1, "1080p": 0.2 }),
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
        start_image_url: request.firstFrameUrl,
        ...(request.lastFrameUrl === undefined
          ? {}
          : { end_image_url: request.lastFrameUrl }),
      },
    }),
  },
};
