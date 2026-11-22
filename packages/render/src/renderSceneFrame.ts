import { fail, type Outcome } from "./outcome.js";
import { loadOutput } from "./project/loadOutput.js";
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
  const { snapshot, output } = loaded.value;
  if (!snapshot.scenes.some((scene) => scene.id === options.sceneId)) {
    return fail({
      kind: "scene-not-found",
      sceneId: options.sceneId,
      message: `The project has no scene "${options.sceneId}".`,
    });
  }
  return renderLoadedFrame({
    loaded: {
      ...loaded.value,
      timeline: {
        outputId: output.id,
        tracks: [
          {
            id: "scene",
            kind: "scene",
            clips: [
              {
                id: options.sceneId,
                sceneId: options.sceneId,
                startFrame: 0,
                durationFrames: options.durationFrames,
                sceneStartFrame: 0,
              },
            ],
          },
        ],
      },
      frameCount: options.durationFrames,
    },
    frame: options.frame,
    scale: options.scale,
  });
}
