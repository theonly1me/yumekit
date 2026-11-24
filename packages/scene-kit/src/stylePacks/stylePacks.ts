import { isLookId, type LookId } from "../looks/looks.js";
import { editorialStylePack } from "./editorial.js";
import { midnightStylePack } from "./midnight.js";
import { neonStylePack } from "./neon.js";
import { paperStylePack } from "./paper.js";
import { stylePackWithOwnLook, type OwnLook } from "./ownLook.js";
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

export function calmStylePackOf(look: string): StylePack {
  const stylePack = stylePackOf(look);
  return {
    ...stylePack,
    motion: { ...stylePack.motion, riseDistanceUnits: 0, calm: true },
  };
}

export function stylePackOfPage(options: {
  look: string;
  calm: boolean;
  own: OwnLook;
}): StylePack {
  const base = options.calm
    ? calmStylePackOf(options.look)
    : stylePackOf(options.look);
  return stylePackWithOwnLook({ stylePack: base, own: options.own });
}
