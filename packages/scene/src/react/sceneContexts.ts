import { createContext } from "react";
import type { SceneAsset, SceneOutput } from "../contract.js";
import type { HoldRegistry } from "./holdRegistry.js";

export type SceneLayout = "wide" | "tall" | "square";

export interface SceneContextValue {
  output: SceneOutput;
  framesPerSecond: number;
  durationFrames: number;
  layout: SceneLayout;
  unit: number;
  findAsset: (assetId: string) => SceneAsset | undefined;
}

export const FrameContext = createContext<number | undefined>(undefined);

export const SceneContext = createContext<SceneContextValue | undefined>(
  undefined,
);

export const HoldContext = createContext<HoldRegistry | undefined>(undefined);
