import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

const textEndpoint = "blackforestlabs/flux-3/text-to-video";
const imageEndpoint = "blackforestlabs/flux-3/image-to-video";
const firstLastEndpoint = "blackforestlabs/flux-3/first-last-frame-to-video";

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: request.durationSeconds,
    resolution: request.resolution,
    generate_audio: request.withAudio,
  };
}

export const fluxVideo: VideoModel = {
  id: "blackforestlabs/flux-3/video",
  label: "FLUX 3 Video",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [
    falPage(textEndpoint),
    falPage(imageEndpoint),
    falPage(firstLastEndpoint),
  ],
  durationSeconds: { minimum: 5, maximum: 20, default: 5 },
  resolutions: ["720p", "1080p", "1440p", "2160p"],
  defaultResolution: "720p",
  aspectRatios: ["21:9", "2:1", "16:9", "4:3", "1:1", "3:4", "9:16"],
  sound: "switch",
  prices: perSecondByResolution({
    "720p": 0.17,
    "1080p": 0.29,
    "1440p": 0.32,
    "2160p": 0.47,
  }),
  textToVideo: (request) => ({
    endpointId: textEndpoint,
    fields: { ...sharedFields(request), aspect_ratio: request.aspectRatio },
  }),
  firstFrame: {
    acceptsLastFrame: true,
    call: (request) =>
      request.lastFrameUrl === undefined
        ? {
            endpointId: imageEndpoint,
            fields: {
              ...sharedFields(request),
              image_url: request.firstFrameUrl,
            },
          }
        : {
            endpointId: firstLastEndpoint,
            fields: {
              ...sharedFields(request),
              start_image_url: request.firstFrameUrl,
              end_image_url: request.lastFrameUrl,
            },
          },
  },
};
