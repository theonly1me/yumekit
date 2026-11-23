import type { FilmBox, FilmGrid } from "./filmGrid.js";
import { fitBox } from "./regionView.js";

const sideHeadingUnits = 54;

export interface MediaPlacement {
  box: FilmBox;
  heading: FilmBox;
  isBeside: boolean;
}

function areaOf(box: { width: number; height: number }): number {
  return box.width * box.height;
}

export function placeMedia(options: {
  grid: FilmGrid;
  aspect: number;
  hasHeading: boolean;
  labelHeight: number;
}): MediaPlacement {
  const { grid, aspect, hasHeading, labelHeight } = options;
  const below = fitBox({
    aspect,
    width: grid.media.width,
    height: grid.media.height - labelHeight,
  });
  const belowPlacement = {
    box: { left: grid.media.left, top: grid.media.top, ...below },
    heading: grid.heading,
    isBeside: false,
  };
  if (!hasHeading || grid.sizes.layout !== "wide") return belowPlacement;
  const headingWidth = sideHeadingUnits * grid.sizes.unit;
  const besideWidth = grid.content.width - headingWidth - grid.gap;
  const beside = fitBox({
    aspect,
    width: besideWidth,
    height: grid.content.height - labelHeight,
  });
  if (areaOf(beside) <= areaOf(below)) return belowPlacement;
  return {
    box: {
      left: grid.content.left + headingWidth + grid.gap,
      top: grid.content.top,
      ...beside,
    },
    heading: {
      left: grid.content.left,
      top: grid.content.top,
      width: headingWidth,
      height: grid.content.height,
    },
    isBeside: true,
  };
}
