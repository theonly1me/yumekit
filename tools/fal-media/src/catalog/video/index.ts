import type { AcceptedInput } from "../acceptedInput.ts";
import { fluxVideo } from "./flux.ts";
import { geminiOmniFlash } from "./geminiOmniFlash.ts";
import { grokImagineVideo } from "./grokImagineVideo.ts";
import { kling4 } from "./kling.ts";
import { ltx25Pro } from "./ltx.ts";
import { minimaxH3 } from "./minimaxH3.ts";
import { pixverse6 } from "./pixverse.ts";
import { seedance25 } from "./seedance.ts";
import type { VideoModel } from "./types.ts";
import { wan30 } from "./wan.ts";

export type {
  EndpointCall,
  FirstFrameRequest,
  ReferenceRequest,
  VideoModel,
  VideoRequest,
} from "./types.ts";

export const videoModels: readonly VideoModel[] = [
  seedance25,
  kling4,
  geminiOmniFlash,
  minimaxH3,
  wan30,
  ltx25Pro,
  pixverse6,
  fluxVideo,
  grokImagineVideo,
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
