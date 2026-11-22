import type { ModelPrice } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

const textEndpoint = "fal-ai/pixverse/v6/text-to-video";
const imageEndpoint = "fal-ai/pixverse/v6/image-to-video";

const usdBySoundAndResolution = {
  "360p": { silent: 0.025, withSound: 0.035 },
  "540p": { silent: 0.035, withSound: 0.045 },
  "720p": { silent: 0.045, withSound: 0.06 },
  "1080p": { silent: 0.09, withSound: 0.115 },
};

const prices: ModelPrice[] = Object.entries(usdBySoundAndResolution).flatMap(
  ([resolution, usd]) => [
    {
      usd: usd.withSound,
      unit: "second" as const,
      when: { resolution, with_audio: "true" },
    },
    {
      usd: usd.silent,
      unit: "second" as const,
      when: { resolution, with_audio: "false" },
    },
  ],
);

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: request.durationSeconds,
    resolution: request.resolution,
    generate_audio_switch: request.withAudio,
  };
}

export const pixverse6: VideoModel = {
  id: "fal-ai/pixverse/v6",
  label: "PixVerse 6",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [falPage(textEndpoint), falPage(imageEndpoint)],
  durationSeconds: { minimum: 1, maximum: 15, default: 5 },
  resolutions: Object.keys(usdBySoundAndResolution),
  defaultResolution: "720p",
  aspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16", "2:3", "3:2", "21:9"],
  sound: "switch",
  prices,
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
