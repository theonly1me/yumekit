import type { ReactNode } from "react";
import { useFrame } from "./hooks.js";
import { FrameContext } from "./sceneContexts.js";

export function FrameWindow(props: {
  startFrame: number;
  durationFrames?: number;
  children: ReactNode;
}): ReactNode {
  const frame = useFrame();
  const windowFrame = frame - props.startFrame;
  const windowDurationFrames = props.durationFrames ?? Number.POSITIVE_INFINITY;
  const isInsideWindow = windowFrame >= 0 && windowFrame < windowDurationFrames;
  if (!isInsideWindow) {
    return null;
  }
  return <FrameContext value={windowFrame}>{props.children}</FrameContext>;
}
