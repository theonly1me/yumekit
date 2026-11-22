import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

const textEndpoint = "bytedance/seedance-2.5/us/text-to-video";
const imageEndpoint = "bytedance/seedance-2.5/us/image-to-video";

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: String(request.durationSeconds),
    resolution: request.resolution,
    generate_audio: request.withAudio,
    output_format: "mp4",
  };
}

export const seedance25: VideoModel & { textEndpointId: string } = {
  textEndpointId: textEndpoint,
  id: "bytedance/seedance-2.5/us",
  label: "Seedance 2.5",
  isDefault: true,
  readOn: "2026-11-22",
  tested: false,
  sources: [falPage(textEndpoint), falPage(imageEndpoint)],
  durationSeconds: { minimum: 4, maximum: 30, default: 5 },
  resolutions: ["480p", "720p", "1080p", "4k"],
  defaultResolution: "720p",
  aspectRatios: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
  sound: "switch",
  prices: perSecondByResolution({
    "480p": 0.2205,
    "720p": 0.473,
    "1080p": 1.164,
    "4k": 1.84,
  }),
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
