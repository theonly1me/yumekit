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

function ltxModel(options: {
  tier: "pro" | "fast";
  label: string;
  lengths: number[];
  usdByResolution: Record<string, number>;
}): VideoModel {
  const textEndpoint = `lightricks/ltx-2.5/text-to-video/${options.tier}`;
  const imageEndpoint = `lightricks/ltx-2.5/image-to-video/${options.tier}`;
  const [shortest = 6] = options.lengths;
  return {
    id: `lightricks/ltx-2.5/${options.tier}`,
    label: options.label,
    isDefault: false,
    readOn: "2026-11-26",
    tested: false,
    sources: [falPage(textEndpoint), falPage(imageEndpoint)],
    durationSeconds: {
      minimum: shortest,
      maximum: Math.max(...options.lengths),
      default: shortest,
      allowed: options.lengths,
    },
    resolutions: Object.keys(options.usdByResolution),
    defaultResolution: "1080p",
    aspectRatios: ["16:9", "9:16"],
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

export const ltx25Pro = ltxModel({
  tier: "pro",
  label: "LTX 2.5 Pro",
  lengths: [6, 8, 10],
  usdByResolution: { "720p": 0.12, "1080p": 0.17 },
});

export const ltx25Fast = ltxModel({
  tier: "fast",
  label: "LTX 2.5 Fast",
  lengths: [6, 8, 10, 12, 14, 16, 18, 20],
  usdByResolution: {
    "720p": 0.09,
    "1080p": 0.13,
    "1440p": 0.19,
    "2160p": 0.3,
  },
});
