import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

const textEndpoint = "xai/grok-imagine-video/v1.5/text-to-video";
const imageEndpoint = "xai/grok-imagine-video/v1.5/image-to-video";

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: request.durationSeconds,
    resolution: request.resolution,
    generate_audio: request.withAudio,
  };
}

export const grokImagineVideo: VideoModel = {
  id: "xai/grok-imagine-video/v1.5",
  label: "Grok Imagine Video 1.5",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [falPage(textEndpoint), falPage(imageEndpoint)],
  durationSeconds: { minimum: 1, maximum: 15, default: 6 },
  resolutions: ["480p", "720p", "1080p"],
  defaultResolution: "720p",
  aspectRatios: [
    "16:9",
    "4:3",
    "3:2",
    "1:1",
    "2:3",
    "3:4",
    "9:16",
    "21:9",
    "5:2",
  ],
  sound: "switch",
  prices: perSecondByResolution({ "480p": 0.08, "720p": 0.14, "1080p": 0.25 }),
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
