import type { JsonObject, SceneAsset, SceneOutput } from "@yumekit/scene";
import { onTestFinished } from "vitest";
import { kitScenesOf } from "../index.js";

export const wideOutput: SceneOutput = {
  id: "wide",
  widthPixels: 1920,
  heightPixels: 1080,
};

export const squareOutput: SceneOutput = {
  id: "square",
  widthPixels: 1080,
  heightPixels: 1080,
};

export const tallOutput: SceneOutput = {
  id: "tall",
  widthPixels: 1080,
  heightPixels: 1920,
};

export async function mountKitScene(options: {
  name: string;
  durationFrames: number;
  props: JsonObject;
  output?: SceneOutput;
  assets?: Record<string, SceneAsset>;
  look?: string;
}) {
  const scene = kitScenesOf(options.look ?? "paper")[options.name];
  if (scene === undefined) {
    throw new Error(`The kit has no scene "${options.name}"`);
  }
  const output = options.output ?? wideOutput;
  const element = document.createElement("div");
  element.style.position = "relative";
  element.style.overflow = "hidden";
  element.style.width = `${String(output.widthPixels)}px`;
  element.style.height = `${String(output.heightPixels)}px`;
  document.body.append(element);
  const assets = new Map(Object.entries(options.assets ?? {}));
  const mounted = await scene.mount({
    element,
    output,
    framesPerSecond: 30,
    durationFrames: options.durationFrames,
    props: options.props,
    findAsset: (assetId) => assets.get(assetId),
  });
  onTestFinished(() => {
    mounted.dispose();
    element.remove();
  });
  return { element, mounted };
}
