import type { ReactNode } from "react";
import { useFrame } from "./hooks.js";
import { FrameContext } from "./sceneContexts.js";

export function FrameWindow(props: {
  startFrame: number;
  durationFrames: number;
  children: ReactNode;
}): ReactNode {
  const frame = useFrame();
  const windowFrame = frame - props.startFrame;
  const isInsideWindow = windowFrame >= 0 && windowFrame < props.durationFrames;
  if (!isInsideWindow) {
    return null;
  }
  return <FrameContext value={windowFrame}>{props.children}</FrameContext>;
}
