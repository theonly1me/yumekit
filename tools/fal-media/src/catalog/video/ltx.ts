import { perSecondByResolution } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { VideoModel, VideoRequest } from "./types.ts";

const textEndpoint = "lightricks/ltx-2.5/text-to-video/pro";
const imageEndpoint = "lightricks/ltx-2.5/image-to-video/pro";

function sharedFields(request: VideoRequest): Record<string, unknown> {
  return {
    prompt: request.prompt,
    duration: request.durationSeconds,
    resolution: request.resolution,
    generate_audio: request.withAudio,
  };
}

export const ltx25Pro: VideoModel = {
  id: "lightricks/ltx-2.5/pro",
  label: "LTX 2.5 Pro",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [falPage(textEndpoint), falPage(imageEndpoint)],
  durationSeconds: { minimum: 6, maximum: 10, default: 6, allowed: [6, 8, 10] },
  resolutions: ["720p", "1080p"],
  defaultResolution: "1080p",
  aspectRatios: ["16:9", "9:16"],
  sound: "switch",
  prices: perSecondByResolution({ "720p": 0.12, "1080p": 0.17 }),
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
