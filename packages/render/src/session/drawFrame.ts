import type { StagePage } from "../browser/openStagePage.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";

export async function drawFrame(options: {
  stagePage: StagePage;
  frame: number;
}): Promise<Outcome<Uint8Array, RenderFailure>> {
  const { stagePage, frame } = options;
  const seek = await stagePage.seek(frame);
  if (!seek.ok) {
    return fail({
      kind: "scene-error",
      sceneId: seek.sceneId,
      frame,
      message: `Scene "${seek.sceneId}" failed at frame ${String(frame)}: ${seek.message}`,
    });
  }
  return succeed(await stagePage.screenshot());
}
