import { useContext, useLayoutEffect, useState } from "react";
import { createHold } from "./holdRegistry.js";
import {
  FrameContext,
  HoldContext,
  SceneContext,
  type SceneContextValue,
} from "./sceneContexts.js";

const outsideSceneMessage =
  "This hook works only inside a scene from defineReactScene";

export function useFrame(): number {
  const frame = useContext(FrameContext);
  if (frame === undefined) {
    throw new Error(outsideSceneMessage);
  }
  return frame;
}

export function useSceneContext(): SceneContextValue {
  const sceneContext = useContext(SceneContext);
  if (sceneContext === undefined) {
    throw new Error(outsideSceneMessage);
  }
  return sceneContext;
}

export function useHold(): { release: () => void } {
  const holdRegistry = useContext(HoldContext);
  if (holdRegistry === undefined) {
    throw new Error(outsideSceneMessage);
  }
  const [hold] = useState(createHold);
  useLayoutEffect(() => holdRegistry.add(hold), [holdRegistry, hold]);
  return { release: hold.release };
}
