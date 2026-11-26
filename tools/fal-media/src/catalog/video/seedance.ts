import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

const maximumReferencePictures = 30;

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: String(request.durationSeconds),
    resolution: request.resolution,
    generate_audio: request.withAudio,
    output_format: "mp4",
  };
}

function seedanceModel(options: {
  id: string;
  label: string;
  isDefault: boolean;
  usdByResolution: Record<string, number>;
}): VideoModel & { textEndpointId: string } {
  const textEndpoint = `${options.id}/text-to-video`;
  const imageEndpoint = `${options.id}/image-to-video`;
  const referenceEndpoint = `${options.id}/reference-to-video`;
  return {
    textEndpointId: textEndpoint,
    id: options.id,
    label: options.label,
    isDefault: options.isDefault,
    readOn: "2026-11-26",
    tested: false,
    sources: [
      falPage(textEndpoint),
      falPage(imageEndpoint),
      falPage(referenceEndpoint),
    ],
    durationSeconds: { minimum: 4, maximum: 30, default: 5 },
    resolutions: Object.keys(options.usdByResolution),
    defaultResolution: "720p",
    aspectRatios: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
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
    references: {
      maximum: maximumReferencePictures,
      call: (request) => ({
        endpointId: referenceEndpoint,
        fields: {
          ...sharedFields(request),
          aspect_ratio: request.aspectRatio,
          image_urls: request.referenceImageUrls,
        },
      }),
    },
  };
}

export const seedance25 = seedanceModel({
  id: "bytedance/seedance-2.5/us",
  label: "Seedance 2.5",
  isDefault: true,
  usdByResolution: {
    "480p": 0.2205,
    "720p": 0.473,
    "1080p": 1.164,
    "4k": 1.84,
  },
});

export const seedance25Flash = seedanceModel({
  id: "bytedance/seedance-2.5/flash",
  label: "Seedance 2.5 Flash",
  isDefault: false,
  usdByResolution: { "480p": 0.1345, "720p": 0.3024 },
});
