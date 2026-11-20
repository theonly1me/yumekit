import { onTestFinished } from "vitest";
import type {
  JsonObject,
  SceneAsset,
  SceneModule,
  SceneOutput,
} from "../index.js";

const wideOutput: SceneOutput = {
  id: "wide",
  widthPixels: 320,
  heightPixels: 180,
};

export async function mountForTest(options: {
  scene: SceneModule;
  durationFrames: number;
  output?: SceneOutput;
  props?: JsonObject;
  assets?: Record<string, SceneAsset>;
}) {
  const output = options.output ?? wideOutput;
  const assets = new Map(Object.entries(options.assets ?? {}));
  const element = document.createElement("div");
  element.style.width = `${String(output.widthPixels)}px`;
  element.style.height = `${String(output.heightPixels)}px`;
  document.body.append(element);
  const mounted = await options.scene.mount({
    element,
    output,
    framesPerSecond: 30,
    durationFrames: options.durationFrames,
    props: options.props ?? {},
    findAsset: (assetId) => assets.get(assetId),
  });
  onTestFinished(() => {
    mounted.dispose();
    element.remove();
  });
  return { element, mounted };
}
