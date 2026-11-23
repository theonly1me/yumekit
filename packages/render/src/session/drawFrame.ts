import type { PictureUse, StagePage } from "../browser/openStagePage.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";

export async function drawFrame(options: {
  stagePage: StagePage;
  frame: number;
  use: PictureUse;
}): Promise<Outcome<Uint8Array, RenderFailure>> {
  const { stagePage, frame } = options;
  const seek = await stagePage.seek(frame);
  const videoFramesFailure = seek.ok
    ? undefined
    : stagePage.videoFramesFailure();
  if (videoFramesFailure !== undefined) {
    return fail(videoFramesFailure);
  }
  if (!seek.ok && seek.kind === "kit-scene-not-found") {
    return fail({
      kind: "kit-scene-not-found",
      sceneId: seek.sceneId,
      component: seek.component,
      message: seek.message,
    });
  }
  if (!seek.ok) {
    return fail({
      kind: "scene-error",
      sceneId: seek.sceneId,
      frame,
      message: `Scene "${seek.sceneId}" failed at frame ${String(frame)}: ${seek.message}`,
    });
  }
  return succeed(await stagePage.screenshot(options.use));
}
