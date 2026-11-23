import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import type { LoadedOutput } from "./loadOutput.js";

export function sceneAloneOf(options: {
  loaded: LoadedOutput;
  sceneId: string;
  durationFrames: number;
}): Outcome<LoadedOutput, RenderFailure> {
  const { loaded, sceneId, durationFrames } = options;
  if (!loaded.snapshot.scenes.some((scene) => scene.id === sceneId)) {
    return fail({
      kind: "scene-not-found",
      sceneId,
      message: `The project has no scene "${sceneId}".`,
    });
  }
  return succeed({
    ...loaded,
    timeline: {
      outputId: loaded.output.id,
      tracks: [
        {
          id: "scene",
          kind: "scene",
          clips: [
            {
              id: sceneId,
              sceneId,
              startFrame: 0,
              durationFrames,
              sceneStartFrame: 0,
            },
          ],
        },
      ],
    },
    frameCount: durationFrames,
  });
}
