import { perSecondByResolutionAndSound } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: request.durationSeconds,
    resolution: request.resolution,
    generate_audio_switch: request.withAudio,
  };
}

function pixverseModel(options: {
  id: string;
  label: string;
  usdByResolution: Record<string, { silent: number; withSound: number }>;
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
    durationSeconds: { minimum: 1, maximum: 15, default: 5 },
    resolutions: Object.keys(options.usdByResolution),
    defaultResolution: "720p",
    aspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16", "2:3", "3:2", "21:9"],
    sound: "switch",
    prices: perSecondByResolutionAndSound(options.usdByResolution),
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
}

export const pixverse6 = pixverseModel({
  id: "fal-ai/pixverse/v6",
  label: "PixVerse 6",
  usdByResolution: {
    "360p": { silent: 0.025, withSound: 0.035 },
    "540p": { silent: 0.035, withSound: 0.045 },
    "720p": { silent: 0.045, withSound: 0.06 },
    "1080p": { silent: 0.09, withSound: 0.115 },
  },
});

export const pixverse6Max = pixverseModel({
  id: "pixverse/v6/max",
  label: "PixVerse 6 Max",
  usdByResolution: {
    "360p": { silent: 0.054, withSound: 0.081 },
    "540p": { silent: 0.081, withSound: 0.099 },
    "720p": { silent: 0.099, withSound: 0.135 },
    "1080p": { silent: 0.198, withSound: 0.252 },
  },
});
