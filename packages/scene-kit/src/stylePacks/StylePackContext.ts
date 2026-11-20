import { createContext, useContext } from "react";
import type { StylePack } from "./stylePack.js";

export const StylePackContext = createContext<StylePack | undefined>(undefined);

export function useStylePack(): StylePack {
  const stylePack = useContext(StylePackContext);
  if (stylePack === undefined) {
    throw new Error("A kit scene needs a style pack from defineKitScene");
  }
  return stylePack;
}
