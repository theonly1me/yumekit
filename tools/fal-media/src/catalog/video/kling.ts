import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel } from "./types.ts";

const textEndpoint = "kling/v4/text-to-video";
const imageEndpoint = "kling/v4/image-to-video";

export const kling4: VideoModel = {
  id: "kling/v4",
  label: "Kling 4",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [falPage(textEndpoint), falPage(imageEndpoint)],
  durationSeconds: { minimum: 3, maximum: 30, default: 5 },
  resolutions: ["720p", "1080p", "4k"],
  defaultResolution: "1080p",
  aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
  sound: "none",
  prices: perSecondByResolution({ "720p": 0.157, "1080p": 0.235, "4k": 0.549 }),
  textToVideo: (request) => ({
    endpointId: textEndpoint,
    fields: {
      prompt: request.prompt,
      duration: request.durationSeconds,
      resolution: request.resolution,
      aspect_ratio: request.aspectRatio,
    },
  }),
  firstFrame: {
    acceptsLastFrame: true,
    call: (request) => ({
      endpointId: imageEndpoint,
      fields: {
        prompt: request.prompt,
        duration: request.durationSeconds,
        resolution: request.resolution,
        start_image_url: request.firstFrameUrl,
        ...(request.lastFrameUrl === undefined
          ? {}
          : { end_image_url: request.lastFrameUrl }),
      },
    }),
  },
};
