import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

const textEndpoint = "blackforestlabs/flux-3-max/text-to-video";
const imageEndpoint = "blackforestlabs/flux-3-max/image-to-video";

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: request.durationSeconds,
    resolution: request.resolution,
    generate_audio: request.withAudio,
  };
}

export const fluxMaxVideo: VideoModel = {
  id: "blackforestlabs/flux-3-max/video",
  label: "FLUX 3 Max Video",
  isDefault: false,
  readOn: "2026-11-26",
  tested: false,
  sources: [falPage(textEndpoint), falPage(imageEndpoint)],
  durationSeconds: { minimum: 5, maximum: 20, default: 5 },
  resolutions: ["720p", "1080p", "2K", "4K"],
  defaultResolution: "720p",
  aspectRatios: ["21:9", "2:1", "16:9", "4:3", "1:1", "3:4", "9:16"],
  sound: "switch",
  prices: perSecondByResolution({
    "720p": 0.17,
    "1080p": 0.29,
    "2K": 0.4,
    "4K": 0.8,
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
};
