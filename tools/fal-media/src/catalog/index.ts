import { seedance25 } from "./seedance.ts";
import type { VideoModel } from "./types.ts";

export type {
  ImageEndpoint,
  ImageRequest,
  TextEndpoint,
  TextRequest,
  VideoModel,
} from "./types.ts";

export const videoModels: readonly VideoModel[] = [seedance25];

export function findVideoModel(id: string | undefined): VideoModel | undefined {
  if (id === undefined) return videoModels.find((model) => model.isDefault);
  return videoModels.find((model) => model.id === id);
}

function ratioOf(shape: string): number {
  const [width, height] = shape.split(":").map(Number);
  if (width === undefined || height === undefined) {
    throw new Error(`The aspect ratio ${shape} is not written as width:height`);
  }
  return width / height;
}

export function nearestAspectRatio(options: {
  model: VideoModel;
  widthPixels: number;
  heightPixels: number;
}): string {
  const wanted = Math.log(options.widthPixels / options.heightPixels);
  const distanceOf = (shape: string) =>
    Math.abs(Math.log(ratioOf(shape)) - wanted);
  const [first, ...others] = options.model.aspectRatios;
  if (first === undefined) {
    throw new Error(`The model ${options.model.id} lists no aspect ratio`);
  }
  let nearest = first;
  for (const shape of others) {
    if (distanceOf(shape) < distanceOf(nearest)) nearest = shape;
  }
  return nearest;
}

export function estimatedCostUsd(options: {
  model: VideoModel;
  resolution: string;
  durationSeconds: number;
}): number {
  const usdPerSecond =
    options.model.usdPerSecondByResolution[options.resolution];
  if (usdPerSecond === undefined) {
    throw new Error(
      `The model ${options.model.id} has no price for ${options.resolution}`,
    );
  }
  return Math.round(usdPerSecond * options.durationSeconds * 10_000) / 10_000;
}
