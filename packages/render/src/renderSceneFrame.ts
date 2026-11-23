import type { Outcome } from "./outcome.js";
import { loadOutput } from "./project/loadOutput.js";
import { sceneAloneOf } from "./project/sceneAlone.js";
import type { RenderFailure, RenderScale } from "./renderFailure.js";
import { renderLoadedFrame, type RenderedFrame } from "./renderFrame.js";

export async function renderSceneFrame(options: {
  folder: string;
  outputId: string;
  sceneId: string;
  durationFrames: number;
  frame: number;
  scale?: RenderScale;
}): Promise<Outcome<RenderedFrame, RenderFailure>> {
  const loaded = await loadOutput(options);
  if (!loaded.ok) {
    return loaded;
  }
  const alone = sceneAloneOf({
    loaded: loaded.value,
    sceneId: options.sceneId,
    durationFrames: options.durationFrames,
  });
  if (!alone.ok) {
    return alone;
  }
  return renderLoadedFrame({
    loaded: alone.value,
    frame: options.frame,
    scale: options.scale,
  });
}
