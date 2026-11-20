import { onTestFinished } from "vitest";
import type { JsonObject, SceneModule, SceneOutput } from "../index.js";

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
}) {
  const output = options.output ?? wideOutput;
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
    findAsset: () => undefined,
  });
  onTestFinished(() => {
    mounted.dispose();
    element.remove();
  });
  return { element, mounted };
}
