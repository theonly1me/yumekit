import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: request.durationSeconds,
    resolution: request.resolution,
    generate_audio: request.withAudio,
  };
}

function grokModel(options: {
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
    durationSeconds: { minimum: 1, maximum: 15, default: 6 },
    resolutions: Object.keys(options.usdByResolution),
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
          image_url: request.firstFrameUrl,
          ...(request.lastFrameUrl === undefined
            ? {}
            : { end_image_url: request.lastFrameUrl }),
        },
      }),
    },
  };
}

export const grokImagineVideo = grokModel({
  id: "xai/grok-imagine-video/v1.5",
  label: "Grok Imagine Video 1.5",
  usdByResolution: { "480p": 0.08, "720p": 0.14, "1080p": 0.25 },
});

export const grokImagineVideoLite = grokModel({
  id: "xai/grok-imagine-video/v1.5/lite",
  label: "Grok Imagine Video 1.5 Lite",
  usdByResolution: { "480p": 0.02, "720p": 0.03, "1080p": 0.14 },
});
