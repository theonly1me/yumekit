import type { RenderFailure } from "../renderFailure.js";

export interface FrameRange {
  firstFrame: number;
  frameCount: number;
}

function isFrameInOutput(options: {
  frame: number;
  outputFrameCount: number;
}): boolean {
  return (
    Number.isInteger(options.frame) &&
    options.frame >= 0 &&
    options.frame < options.outputFrameCount
  );
}

function outOfRange(options: {
  frame: number;
  outputFrameCount: number;
}): RenderFailure {
  const { frame, outputFrameCount } = options;
  return {
    kind: "frame-out-of-range",
    frame,
    frameCount: outputFrameCount,
    message:
      outputFrameCount === 0
        ? "The output has no clips, so it has no frames."
        : `Frame ${String(frame)} is outside the output. The frames are 0 to ${String(outputFrameCount - 1)}.`,
  };
}

export function checkFrame(options: {
  frame: number;
  outputFrameCount: number;
}): RenderFailure | undefined {
  return isFrameInOutput(options) ? undefined : outOfRange(options);
}

export function frameRangeOf(options: {
  firstFrame: number | undefined;
  frameCount: number | undefined;
  outputFrameCount: number;
}): FrameRange | RenderFailure {
  const { outputFrameCount } = options;
  const firstFrame = options.firstFrame ?? 0;
  const frameCount = options.frameCount ?? outputFrameCount - firstFrame;
  const lastFrame = firstFrame + frameCount - 1;
  for (const frame of [firstFrame, lastFrame]) {
    if (!isFrameInOutput({ frame, outputFrameCount }) || frameCount < 1) {
      return outOfRange({ frame, outputFrameCount });
    }
  }
  return { firstFrame, frameCount };
}
