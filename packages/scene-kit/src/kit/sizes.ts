import { useSceneContext } from "@yumekit/scene";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import type { StylePack } from "../stylePacks/stylePack.js";

export const fitVariable = "--kit-fit";

export type TextRole = keyof StylePack["textUnits"];

export interface Sizes {
  unit: number;
  layout: "wide" | "tall" | "square";
  fitted: (units: number) => string;
  text: (role: TextRole) => string;
  textUnits: (role: TextRole) => number;
  pixels: (units: number) => string;
}

export function useSizes(): Sizes {
  const { unit, layout } = useSceneContext();
  const stylePack = useStylePack();
  const textScale = layout === "tall" ? stylePack.layout.tallTextScale : 1;
  const fitted = (units: number) =>
    `calc(var(${fitVariable}, 1) * ${String(units * unit)}px)`;
  const textUnits = (role: TextRole) => stylePack.textUnits[role] * textScale;
  return {
    unit,
    layout,
    fitted,
    textUnits,
    text: (role) => fitted(textUnits(role)),
    pixels: (units) => `${String(units * unit)}px`,
  };
}
