import type { AcceptedInput } from "../acceptedInput.ts";
import { fluxVideo } from "./flux.ts";
import { fluxMaxVideo } from "./fluxMax.ts";
import { geminiOmniFlash } from "./geminiOmniFlash.ts";
import { grokImagineVideo, grokImagineVideoLite } from "./grokImagineVideo.ts";
import { happyHorse11 } from "./happyHorse.ts";
import { kling4, kling4Flash } from "./kling.ts";
import { ltx25Fast, ltx25Pro } from "./ltx.ts";
import { minimaxH3 } from "./minimaxH3.ts";
import { minimaxH3Max, minimaxH3MaxTurbo } from "./minimaxH3Max.ts";
import { pixverse6, pixverse6Max } from "./pixverse.ts";
import { seedance25, seedance25Flash } from "./seedance.ts";
import type { VideoModel } from "./types.ts";
import { veo31, veo31Lite } from "./veo.ts";
import { wan30, wan30Prime } from "./wan.ts";

export type {
  EndpointCall,
  FirstFrameRequest,
  ReferenceRequest,
  VideoModel,
  VideoRequest,
} from "./types.ts";

export const videoModels: readonly VideoModel[] = [
  seedance25,
  seedance25Flash,
  kling4,
  kling4Flash,
  minimaxH3,
  minimaxH3Max,
  minimaxH3MaxTurbo,
  wan30,
  wan30Prime,
  happyHorse11,
  geminiOmniFlash,
  veo31,
  veo31Lite,
  ltx25Pro,
  ltx25Fast,
  pixverse6,
  pixverse6Max,
  fluxVideo,
  fluxMaxVideo,
  grokImagineVideo,
  grokImagineVideoLite,
];

export function findVideoModel(id: string | undefined): VideoModel | undefined {
  if (id === undefined) return videoModels.find((model) => model.isDefault);
  return videoModels.find((model) => model.id === id);
}

export function videoAccepts(model: VideoModel): AcceptedInput[] {
  return [
    "first_frame",
    ...(model.firstFrame.acceptsLastFrame ? ["last_frame" as const] : []),
    ...(model.references === undefined ? [] : ["reference_images" as const]),
  ];
}
