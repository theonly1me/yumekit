export interface FrameRange {
  startFrame: number;
  endFrame: number;
}

export interface HoldSplit {
  in: FrameRange;
  hold: FrameRange;
  out: FrameRange;
  settleFrame: number;
}

export const settleShareOfClip = 0.7;
const inShareOfClip = 0.25;
const outShareOfClip = 0.1;

export function holdSplit(options: { durationFrames: number }): HoldSplit {
  const lastFrame = Math.max(0, options.durationFrames - 1);
  const inEndFrame = lastFrame * inShareOfClip;
  const outStartFrame = lastFrame * (1 - outShareOfClip);
  return {
    in: { startFrame: 0, endFrame: inEndFrame },
    hold: { startFrame: inEndFrame, endFrame: outStartFrame },
    out: { startFrame: outStartFrame, endFrame: lastFrame },
    settleFrame: lastFrame * settleShareOfClip,
  };
}

export function paceFrame(options: {
  frame: number;
  durationFrames: number;
  settleFrame: number;
}): number {
  const { settleFrame } = holdSplit(options);
  if (settleFrame <= 0) {
    return options.settleFrame;
  }
  const speed = Math.max(1, options.settleFrame / settleFrame);
  return options.frame * speed;
}
