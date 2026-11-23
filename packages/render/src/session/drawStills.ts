import type { StagePage } from "../browser/openStagePage.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import { pngSizeOf, type PictureSize } from "../png.js";
import { checkFrame } from "../project/frameRange.js";
import type { RenderFailure } from "../renderFailure.js";
import { drawFrame } from "./drawFrame.js";

export interface RenderedFrame extends PictureSize {
  png: Uint8Array;
}

export function checkFrames(options: {
  frames: number[];
  outputFrameCount: number;
}): RenderFailure | undefined {
  return options.frames
    .map((frame) =>
      checkFrame({ frame, outputFrameCount: options.outputFrameCount }),
    )
    .find((failure) => failure !== undefined);
}

export async function drawStills(options: {
  stagePage: StagePage;
  frames: number[];
}): Promise<Outcome<RenderedFrame[], RenderFailure>> {
  const pictures: RenderedFrame[] = [];
  for (const frame of options.frames) {
    const drawn = await drawFrame({
      stagePage: options.stagePage,
      frame,
      use: "still",
    });
    if (!drawn.ok) {
      return fail(drawn.failure);
    }
    pictures.push({ png: drawn.value, ...pngSizeOf(drawn.value) });
  }
  return succeed(pictures);
}
