import type { EndpointRequest, VideoModel } from "./types.ts";

function sharedFields(request: EndpointRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: String(request.durationSeconds),
    resolution: request.resolution,
    generate_audio: request.withAudio,
    output_format: "mp4",
  };
}

export const seedance25: VideoModel = {
  id: "bytedance/seedance-2.5/us",
  label: "Seedance 2.5",
  isDefault: true,
  readOn: "2026-11-21",
  durationSeconds: { minimum: 4, maximum: 30, default: 5 },
  resolutions: ["480p", "720p", "1080p", "4k"],
  defaultResolution: "720p",
  aspectRatios: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
  usdPerSecondByResolution: {
    "480p": 0.2205,
    "720p": 0.473,
    "1080p": 1.164,
    "4k": 1.84,
  },
  textToVideo: {
    endpointId: "bytedance/seedance-2.5/us/text-to-video",
    fieldsOf: (request) => ({
      ...sharedFields(request),
      aspect_ratio: request.aspectRatio,
    }),
  },
  imageToVideo: {
    endpointId: "bytedance/seedance-2.5/us/image-to-video",
    acceptsLastFrame: true,
    fieldsOf: (request) => ({
      ...sharedFields(request),
      image_url: request.firstFrameUrl,
      ...(request.lastFrameUrl === undefined
        ? {}
        : { end_image_url: request.lastFrameUrl }),
    }),
  },
};
