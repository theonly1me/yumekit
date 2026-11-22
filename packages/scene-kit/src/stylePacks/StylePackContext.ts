import { createContext, useContext } from "react";
import { paperStylePack } from "./paper.js";
import type { StylePack } from "./stylePack.js";
import { stylePackOf } from "./stylePacks.js";

export const StylePackContext = createContext<StylePack | undefined>(undefined);

let stylePackOfPage: StylePack = paperStylePack;

export function activateLook(look: string): StylePack {
  stylePackOfPage = stylePackOf(look);
  return stylePackOfPage;
}

export function useStylePack(): StylePack {
  return useContext(StylePackContext) ?? stylePackOfPage;
}
