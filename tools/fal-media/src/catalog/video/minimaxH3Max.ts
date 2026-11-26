import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

const maximumReferencePictures = 9;

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: request.durationSeconds,
    resolution: request.resolution,
    prompt_expansion_mode: "balanced",
  };
}

function h3MaxModel(options: {
  id: string;
  label: string;
  usdByResolution: Record<string, number>;
  takesReferences: boolean;
}): VideoModel {
  const textEndpoint = `${options.id}/text-to-video`;
  const imageEndpoint = `${options.id}/image-to-video`;
  const referenceEndpoint = `${options.id}/reference-to-video`;
  return {
    id: options.id,
    label: options.label,
    isDefault: false,
    readOn: "2026-11-26",
    tested: false,
    sources: [
      falPage(textEndpoint),
      falPage(imageEndpoint),
      ...(options.takesReferences ? [falPage(referenceEndpoint)] : []),
    ],
    durationSeconds: { minimum: 1, maximum: 15, default: 5 },
    resolutions: Object.keys(options.usdByResolution),
    defaultResolution: "768P",
    aspectRatios: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
    sound: "always",
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
    ...(options.takesReferences
      ? { references: referencesOf(referenceEndpoint) }
      : {}),
  };
}

function referencesOf(
  endpointId: string,
): NonNullable<VideoModel["references"]> {
  return {
    maximum: maximumReferencePictures,
    call: (request) => ({
      endpointId,
      fields: {
        ...sharedFields(request),
        aspect_ratio: request.aspectRatio,
        reference_image_urls: request.referenceImageUrls,
      },
    }),
  };
}

export const minimaxH3Max = h3MaxModel({
  id: "minimax/h3-max",
  label: "MiniMax H3 Max",
  usdByResolution: { "480P": 0.05, "768P": 0.08, "1080P": 0.16 },
  takesReferences: true,
});

export const minimaxH3MaxTurbo = h3MaxModel({
  id: "minimax/h3-max-turbo",
  label: "MiniMax H3 Max Turbo",
  usdByResolution: { "480P": 0.025, "768P": 0.04, "1080P": 0.08 },
  takesReferences: false,
});
