import type { SceneOutput } from "../contract.js";
import type { SceneLayout } from "./sceneContexts.js";

const wideAspectRatio = 1.2;
const tallAspectRatio = 0.8;

export function layoutFor(output: SceneOutput): SceneLayout {
  const aspectRatio = output.widthPixels / output.heightPixels;
  if (aspectRatio >= wideAspectRatio) {
    return "wide";
  }
  if (aspectRatio <= tallAspectRatio) {
    return "tall";
  }
  return "square";
}

export function unitFor(output: SceneOutput): number {
  return Math.min(output.widthPixels, output.heightPixels) / 100;
}
