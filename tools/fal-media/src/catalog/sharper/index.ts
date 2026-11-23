import { sharperModel, type SharpenKind, type SharperModel } from "./types.ts";

export type {
  SharpenKind,
  SharpenRequest,
  SharpenScale,
  SharperModel,
} from "./types.ts";

export const sharperModels: readonly SharperModel[] = [
  sharperModel({
    endpointId: "bria/video/increase-resolution",
    label: "Bria Increase Resolution for video",
    takes: "video",
    isDefault: true,
    prices: [{ usd: 0.14, unit: "second", when: {} }],
    fields: (request) => ({
      video_url: request.mediaUrl,
      desired_increase: String(request.scale),
      output_container_and_codec: "mp4_h264",
      preserve_audio: true,
    }),
  }),
  sharperModel({
    endpointId: "topaz/upscale/video/precision",
    label: "Topaz Precision for video",
    takes: "video",
    fields: (request) => ({
      video_url: request.mediaUrl,
      upscale_factor: request.scale,
      H264_output: true,
    }),
  }),
  sharperModel({
    endpointId: "fal-ai/seedvr/upscale/video",
    label: "SeedVR2 for video",
    takes: "video",
    fields: (request) => ({
      video_url: request.mediaUrl,
      upscale_mode: "factor",
      upscale_factor: request.scale,
      output_format: "X264 (.mp4)",
    }),
  }),
  sharperModel({
    endpointId: "openimaginglab/flashvsr-plus",
    label: "FlashVSR+ for video",
    takes: "video",
    fields: (request) => ({
      video_url: request.mediaUrl,
      upscale_factor: request.scale,
      video_output_type: "X264 (.mp4)",
      preserve_audio: true,
    }),
  }),
  sharperModel({
    endpointId: "clarityai/crystal-video-upscaler",
    label: "Crystal Upscaler for video",
    takes: "video",
    fields: (request) => ({
      video_url: request.mediaUrl,
      scale_factor: request.scale,
    }),
  }),
  sharperModel({
    endpointId: "bria/increase-resolution",
    label: "Bria Increase Resolution for pictures",
    takes: "image",
    prices: [{ usd: 0.04, unit: "image", when: {} }],
    fields: (request) => ({
      image_url: request.mediaUrl,
      desired_increase: request.scale,
      output_type: "png",
    }),
  }),
  sharperModel({
    endpointId: "topaz/upscale/image/precision",
    label: "Topaz Precision for pictures",
    takes: "image",
    fields: (request) => ({
      image_url: request.mediaUrl,
      upscale_factor: request.scale,
      output_format: "png",
    }),
  }),
  sharperModel({
    endpointId: "fal-ai/seedvr/upscale/image",
    label: "SeedVR2 for pictures",
    takes: "image",
    fields: (request) => ({
      image_url: request.mediaUrl,
      upscale_mode: "factor",
      upscale_factor: request.scale,
      output_format: "png",
    }),
  }),
  sharperModel({
    endpointId: "clarityai/crystal-upscaler",
    label: "Crystal Upscaler for pictures",
    takes: "image",
    fields: (request) => ({
      image_url: request.mediaUrl,
      scale_factor: request.scale,
      output_format: "png",
    }),
  }),
];

export function sharperModelFor(options: {
  id: string | undefined;
  kind: SharpenKind;
}): SharperModel | undefined {
  if (options.id !== undefined) {
    return sharperModels.find((model) => model.id === options.id);
  }
  return (
    sharperModels.find(
      (model) => model.isDefault && model.takes === options.kind,
    ) ?? sharperModels.find((model) => model.takes === options.kind)
  );
}
