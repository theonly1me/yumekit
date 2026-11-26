import { perSecondByResolutionAndSound } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: `${String(request.durationSeconds)}s`,
    resolution: request.resolution,
    generate_audio: request.withAudio,
  };
}

function veoModel(options: {
  id: string;
  label: string;
  usdByResolution: Record<string, { silent: number; withSound: number }>;
}): VideoModel {
  const textEndpoint = options.id;
  const imageEndpoint = `${options.id}/image-to-video`;
  const firstLastEndpoint = `${options.id}/first-last-frame-to-video`;
  return {
    id: options.id,
    label: options.label,
    isDefault: false,
    readOn: "2026-11-26",
    tested: false,
    sources: [
      falPage(textEndpoint),
      falPage(imageEndpoint),
      falPage(firstLastEndpoint),
    ],
    durationSeconds: { minimum: 4, maximum: 8, default: 4, allowed: [4, 6, 8] },
    resolutions: Object.keys(options.usdByResolution),
    defaultResolution: "720p",
    aspectRatios: ["16:9", "9:16"],
    sound: "switch",
    prices: perSecondByResolutionAndSound(options.usdByResolution),
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
                first_frame_url: request.firstFrameUrl,
                last_frame_url: request.lastFrameUrl,
              },
            },
    },
  };
}

export const veo31 = veoModel({
  id: "fal-ai/veo3.1",
  label: "Veo 3.1",
  usdByResolution: {
    "720p": { silent: 0.2, withSound: 0.4 },
    "1080p": { silent: 0.2, withSound: 0.4 },
    "4k": { silent: 0.4, withSound: 0.6 },
  },
});

export const veo31Lite = veoModel({
  id: "fal-ai/veo3.1/lite",
  label: "Veo 3.1 Lite",
  usdByResolution: {
    "720p": { silent: 0.03, withSound: 0.05 },
    "1080p": { silent: 0.05, withSound: 0.08 },
  },
});
