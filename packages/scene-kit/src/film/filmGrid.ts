import { useSceneContext } from "@yumekit/scene";
import { useSizes, type Sizes } from "../kit/sizes.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";

export interface FilmBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FilmGrid {
  sizes: Sizes;
  frame: FilmBox;
  heading: FilmBox;
  media: FilmBox;
  content: FilmBox;
  gap: number;
  labelGap: number;
}

interface GridUnits {
  margin: number;
  headingTop: number;
  mediaTop: number;
}

export const filmGridUnits: Record<Sizes["layout"], GridUnits> = {
  wide: { margin: 13, headingTop: 10, mediaTop: 29 },
  square: { margin: 8, headingTop: 8, mediaTop: 25 },
  tall: { margin: 8, headingTop: 14, mediaTop: 34 },
};

const gapUnits = 2.4;
const entryRoomUnits = 3;
const labelGapUnits = 1.6;

export function useFilmGrid(options: { hasHeading: boolean }): FilmGrid {
  const sizes = useSizes();
  const { output } = useSceneContext();
  const stylePack = useStylePack();
  const { unit } = sizes;
  const units = filmGridUnits[sizes.layout];
  const margin = units.margin * unit;
  const width = output.widthPixels;
  const height = output.heightPixels;
  const contentBottom =
    height - (stylePack.layout.captionAreaUnits + entryRoomUnits) * unit;
  const contentWidth = width - 2 * margin;
  const headingTop = units.headingTop * unit;
  const mediaTop = options.hasHeading ? units.mediaTop * unit : headingTop;
  return {
    sizes,
    frame: { left: 0, top: 0, width, height },
    heading: {
      left: margin,
      top: headingTop,
      width: contentWidth,
      height: units.mediaTop * unit - headingTop - gapUnits * unit,
    },
    media: {
      left: margin,
      top: mediaTop,
      width: contentWidth,
      height: contentBottom - mediaTop,
    },
    content: {
      left: margin,
      top: headingTop,
      width: contentWidth,
      height: contentBottom - headingTop,
    },
    gap: gapUnits * unit,
    labelGap: labelGapUnits * unit,
  };
}

export function boxStyle(box: FilmBox) {
  return {
    position: "absolute",
    left: `${String(box.left)}px`,
    top: `${String(box.top)}px`,
    width: `${String(box.width)}px`,
    height: `${String(box.height)}px`,
  } as const;
}
