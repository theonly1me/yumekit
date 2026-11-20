import { fail, succeed, type Outcome } from "./outcome.js";
import { pngSizeOf } from "./png.js";
import { checkFrame } from "./project/frameRange.js";
import { loadOutput } from "./project/loadOutput.js";
import type { RenderFailure, RenderScale } from "./renderFailure.js";
import { drawFrame } from "./session/drawFrame.js";
import { withStagePage } from "./session/withStagePage.js";

export interface RenderedFrame {
  png: Uint8Array;
  widthPixels: number;
  heightPixels: number;
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
  const rangeFailure = checkFrame({
    frame: options.frame,
    outputFrameCount: loaded.value.frameCount,
  });
  if (rangeFailure !== undefined) {
    return fail(rangeFailure);
  }
  return withStagePage({
    loaded: loaded.value,
    scale: options.scale ?? 1,
    use: async (stagePage) => {
      const drawn = await drawFrame({ stagePage, frame: options.frame });
      return drawn.ok
        ? succeed({ png: drawn.value, ...pngSizeOf(drawn.value) })
        : drawn;
    },
  });
}
