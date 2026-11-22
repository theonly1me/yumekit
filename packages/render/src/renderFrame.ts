import { fail, succeed, type Outcome } from "./outcome.js";
import { pngSizeOf } from "./png.js";
import { checkFrame } from "./project/frameRange.js";
import { loadOutput, type LoadedOutput } from "./project/loadOutput.js";
import type { RenderFailure, RenderScale } from "./renderFailure.js";
import { drawFrame } from "./session/drawFrame.js";
import { withStagePage } from "./session/withStagePage.js";

export interface RenderedFrame {
  png: Uint8Array;
  widthPixels: number;
  heightPixels: number;
}

export function renderLoadedFrame(options: {
  loaded: LoadedOutput;
  frame: number;
  scale: RenderScale | undefined;
}): Promise<Outcome<RenderedFrame, RenderFailure>> {
  const rangeFailure = checkFrame({
    frame: options.frame,
    outputFrameCount: options.loaded.frameCount,
  });
  if (rangeFailure !== undefined) {
    return Promise.resolve(fail(rangeFailure));
  }
  return withStagePage({
    loaded: options.loaded,
    scale: options.scale ?? 1,
    use: async (stagePage) => {
      const drawn = await drawFrame({ stagePage, frame: options.frame });
      return drawn.ok
        ? succeed({ png: drawn.value, ...pngSizeOf(drawn.value) })
        : drawn;
    },
  });
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
