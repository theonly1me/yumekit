import { isLookId, type LookId } from "../looks/looks.js";
import { editorialStylePack } from "./editorial.js";
import { midnightStylePack } from "./midnight.js";
import { neonStylePack } from "./neon.js";
import { paperStylePack } from "./paper.js";
import type { StylePack } from "./stylePack.js";
import { studioStylePack } from "./studio.js";

export const stylePacks: Record<LookId, StylePack> = {
  midnight: midnightStylePack,
  studio: studioStylePack,
  editorial: editorialStylePack,
  neon: neonStylePack,
  paper: paperStylePack,
};

export function stylePackOf(look: string): StylePack {
  return isLookId(look) ? stylePacks[look] : paperStylePack;
}
