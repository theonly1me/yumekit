import { fail, type Outcome } from "./outcome.js";
import { loadOutput, type LoadedOutput } from "./project/loadOutput.js";
import type { RenderFailure, RenderScale } from "./renderFailure.js";
import {
  checkFrames,
  drawStills,
  type RenderedFrame,
} from "./session/drawStills.js";
import { withStagePage } from "./session/withStagePage.js";

export type { RenderedFrame } from "./session/drawStills.js";

function onlyPicture(
  drawn: Outcome<RenderedFrame[], RenderFailure>,
): Outcome<RenderedFrame, RenderFailure> {
  if (!drawn.ok) {
    return drawn;
  }
  const [picture] = drawn.value;
  if (picture === undefined) {
    throw new Error("A frame was drawn with no picture");
  }
  return { ok: true, value: picture };
}

export async function renderLoadedFrame(options: {
  loaded: LoadedOutput;
  frame: number;
  scale: RenderScale | undefined;
}): Promise<Outcome<RenderedFrame, RenderFailure>> {
  const frames = [options.frame];
  const rangeFailure = checkFrames({
    frames,
    outputFrameCount: options.loaded.frameCount,
  });
  if (rangeFailure !== undefined) {
    return fail(rangeFailure);
  }
  return onlyPicture(
    await withStagePage({
      loaded: options.loaded,
      scale: options.scale ?? 1,
      use: (stagePage) => drawStills({ stagePage, frames }),
    }),
  );
}

export async function renderFrame(options: {
  folder: string;
  outputId: string;
  frame: number;
  scale?: RenderScale;
}): Promise<Outcome<RenderedFrame, RenderFailure>> {
  const loaded = await loadOutput(options);
  if (!loaded.ok) {
    return loaded;
  }
  return renderLoadedFrame({
    loaded: loaded.value,
    frame: options.frame,
    scale: options.scale,
  });
}
