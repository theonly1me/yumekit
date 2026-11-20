import { useSceneContext } from "@yumekit/scene";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import type { TextUnits } from "../stylePacks/stylePack.js";

export const fitVariable = "--kit-fit";

export type TextRole = keyof TextUnits;

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
  const layoutTextUnits = stylePack.textUnits[layout];
  const fitted = (units: number) =>
    `calc(var(${fitVariable}, 1) * ${String(units * unit)}px)`;
  const textUnits = (role: TextRole) => layoutTextUnits[role];
  return {
    unit,
    layout,
    fitted,
    textUnits,
    text: (role) => fitted(textUnits(role)),
    pixels: (units) => `${String(units * unit)}px`,
  };
}
