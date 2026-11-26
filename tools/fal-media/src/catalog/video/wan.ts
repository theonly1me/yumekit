import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: request.durationSeconds,
    resolution: request.resolution,
    audio: request.withAudio,
  };
}

function wanModel(options: {
  id: string;
  label: string;
  usdByResolution: Record<string, number>;
}): VideoModel {
  const textEndpoint = `${options.id}/text-to-video`;
  const imageEndpoint = `${options.id}/image-to-video`;
  return {
    id: options.id,
    label: options.label,
    isDefault: false,
    readOn: "2026-11-26",
    tested: false,
    sources: [falPage(textEndpoint), falPage(imageEndpoint)],
    durationSeconds: { minimum: 2, maximum: 30, default: 5 },
    resolutions: Object.keys(options.usdByResolution),
    defaultResolution: "1080p",
    aspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16"],
    sound: "switch",
    prices: perSecondByResolution(options.usdByResolution),
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
}

export const wan30 = wanModel({
  id: "alibaba/wan-3.0",
  label: "Wan 3.0",
  usdByResolution: { "480p": 0.05, "720p": 0.1, "1080p": 0.2 },
});

export const wan30Prime = wanModel({
  id: "alibaba/wan-3.0-prime",
  label: "Wan 3.0 Prime",
  usdByResolution: { "480p": 0.068, "720p": 0.14, "1080p": 0.28 },
});
