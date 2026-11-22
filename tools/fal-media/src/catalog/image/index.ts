import { fluxImage } from "./flux.ts";
import { gptImageFlare } from "./gptImage.ts";
import { ideogram46 } from "./ideogram.ts";
import { krea3 } from "./krea.ts";
import { minimaxH3Image } from "./minimaxH3Image.ts";
import { nanoBanana21 } from "./nanoBanana.ts";
import { qwenImage3 } from "./qwenImage.ts";
import { seedream55 } from "./seedream.ts";
import type { ImageModel } from "./types.ts";

export type {
  ImageChoiceName,
  ImageChoiceSetting,
  ImageModel,
  ImageRequest,
  ReferenceImageRequest,
} from "./types.ts";

export const imageModels: readonly ImageModel[] = [
  seedream55,
  nanoBanana21,
  fluxImage,
  gptImageFlare,
  ideogram46,
  qwenImage3,
  minimaxH3Image,
  krea3,
];

export function findImageModel(id: string | undefined): ImageModel | undefined {
  if (id === undefined) return imageModels.find((model) => model.isDefault);
  return imageModels.find((model) => model.id === id);
}
