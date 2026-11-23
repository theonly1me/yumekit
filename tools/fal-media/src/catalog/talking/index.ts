import { perSecondByResolution } from "../prices.ts";
import type { SharpenKind } from "../sharper/index.ts";
import {
  mediaField,
  promptField,
  talkingModel,
  type TalkingModel,
} from "./types.ts";

export type { TalkingModel, TalkingRequest } from "./types.ts";

const perSecond = (usd: number) => [{ usd, unit: "second" as const, when: {} }];

const heygenResolutions = { choices: ["1080p", "2k"], default: "1080p" };

export const talkingModels: readonly TalkingModel[] = [
  talkingModel({
    endpointId: "heygen/avatar-6/turbo/image-to-video",
    label: "HeyGen Avatar 6 Turbo",
    takes: "image",
    isDefault: true,
    resolutions: heygenResolutions,
    prices: perSecondByResolution({ "1080p": 0.05, "2k": 0.0875 }),
    fields: (request) => ({
      ...mediaField({ request, field: "image_url" }),
      resolution: request.resolution,
      ...promptField({ request, field: "motion_prompt" }),
    }),
  }),
  talkingModel({
    endpointId: "minimax/h3-max/lip-sync/image-to-video",
    label: "MiniMax H3 Max Lip Sync",
    takes: "image",
    resolutions: { choices: ["480P", "768P", "1080P", "2K"], default: "768P" },
    minimumVoiceSeconds: 5,
    longVoiceFactor: { afterSeconds: 15, factor: 1.2 },
    prices: perSecondByResolution({
      "480P": 0.05,
      "768P": 0.08,
      "1080P": 0.16,
      "2K": 0.32,
    }),
    fields: (request) => ({
      ...mediaField({ request, field: "image_url" }),
      resolution: request.resolution,
    }),
  }),
  talkingModel({
    endpointId: "veed/fabric-1.0",
    label: "VEED Fabric 1.0",
    takes: "image",
    resolutions: { choices: ["720p", "480p"], default: "720p" },
    prices: perSecondByResolution({ "480p": 0.08, "720p": 0.15 }),
    fields: (request) => ({
      ...mediaField({ request, field: "image_url" }),
      resolution: request.resolution,
    }),
  }),
  talkingModel({
    endpointId: "heygen/avatar-6/image-to-video",
    label: "HeyGen Avatar 6",
    takes: "image",
    resolutions: heygenResolutions,
    prices: perSecondByResolution({ "1080p": 0.1, "2k": 0.145 }),
    fields: (request) => ({
      ...mediaField({ request, field: "image_url" }),
      resolution: request.resolution,
      ...promptField({ request, field: "motion_prompt" }),
    }),
  }),
  talkingModel({
    endpointId: "fal-ai/kling-video/ai-avatar/v2/pro",
    label: "Kling AI Avatar 2 Pro",
    takes: "image",
    prices: perSecond(0.115),
    fields: (request) => ({
      ...mediaField({ request, field: "image_url" }),
      ...promptField({ request, field: "prompt" }),
    }),
  }),
  talkingModel({
    endpointId: "fal-ai/sync-lipsync/v3/image-to-video",
    label: "sync-3 Avatar",
    takes: "image",
    prices: perSecond(0.1333),
    fields: (request) => mediaField({ request, field: "image_url" }),
  }),
  talkingModel({
    endpointId: "fal-ai/pixverse/lipsync",
    label: "PixVerse Lipsync",
    takes: "video",
    prices: perSecond(0.04),
    fields: (request) => mediaField({ request, field: "video_url" }),
  }),
  talkingModel({
    endpointId: "veed/lipsync/v2",
    label: "VEED Lipsync 2",
    takes: "video",
    prices: perSecond(0.07),
    fields: (request) => mediaField({ request, field: "video_url" }),
  }),
  talkingModel({
    endpointId: "fal-ai/heygen/v3/lipsync/precision",
    label: "HeyGen Lipsync Precision",
    takes: "video",
    prices: perSecond(0.1),
    fields: (request) => mediaField({ request, field: "video_url" }),
  }),
  talkingModel({
    endpointId: "fal-ai/sync-lipsync/v3",
    label: "sync-3 Lipsync",
    takes: "video",
    prices: perSecond(0.1333),
    fields: (request) => ({
      ...mediaField({ request, field: "video_url" }),
      sync_mode: "bounce",
    }),
  }),
];

export function talkingModelFor(options: {
  id: string | undefined;
  kind: SharpenKind;
}): TalkingModel | undefined {
  if (options.id !== undefined) {
    return talkingModels.find((model) => model.id === options.id);
  }
  return (
    talkingModels.find(
      (model) => model.isDefault && model.takes === options.kind,
    ) ?? talkingModels.find((model) => model.takes === options.kind)
  );
}
