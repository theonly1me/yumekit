import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type {
  JsonObject,
  MountOptions,
  MountedScene,
  SceneModule,
} from "../contract.js";
import { createHoldRegistry } from "./holdRegistry.js";
import { layoutFor, unitFor } from "./layout.js";
import {
  FrameContext,
  HoldContext,
  SceneContext,
  type SceneContextValue,
} from "./sceneContexts.js";
import { waitForPicture } from "./waitForPicture.js";

type SceneComponent = (props: { props: JsonObject }) => ReactNode;

function sceneContextFor(options: MountOptions): SceneContextValue {
  return {
    output: options.output,
    framesPerSecond: options.framesPerSecond,
    durationFrames: options.durationFrames,
    beatFrames: options.beatFrames,
    layout: layoutFor(options.output),
    unit: unitFor(options.output),
    findAsset: options.findAsset,
  };
}

function assertFrameInClip(options: {
  frame: number;
  durationFrames: number;
}): void {
  const { frame, durationFrames } = options;
  if (!Number.isInteger(frame) || frame < 0 || frame >= durationFrames) {
    throw new Error(
      `Frame ${String(frame)} is not a whole number from 0 to ${String(durationFrames - 1)}`,
    );
  }
}

function mountReactScene(options: {
  component: SceneComponent;
  mountOptions: MountOptions;
}): MountedScene {
  const { component: Component, mountOptions } = options;
  const root = createRoot(mountOptions.element);
  const holdRegistry = createHoldRegistry();
  const sceneContext = sceneContextFor(mountOptions);
  let isDisposed = false;
  return {
    seek: async (frame) => {
      if (isDisposed) {
        throw new Error("The scene is disposed");
      }
      assertFrameInClip({ frame, durationFrames: mountOptions.durationFrames });
      flushSync(() => {
        root.render(
          <SceneContext value={sceneContext}>
            <HoldContext value={holdRegistry}>
              <FrameContext value={frame}>
                <Component props={mountOptions.props} />
              </FrameContext>
            </HoldContext>
          </SceneContext>,
        );
      });
      await waitForPicture({ element: mountOptions.element, holdRegistry });
    },
    dispose: () => {
      isDisposed = true;
      root.unmount();
    },
  };
}

export function defineReactScene(component: SceneComponent): SceneModule {
  return {
    mount: (mountOptions) =>
      Promise.resolve(mountReactScene({ component, mountOptions })),
  };
}
