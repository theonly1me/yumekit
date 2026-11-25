export interface PictureSize {
  widthPixels: number;
  heightPixels: number;
}

export interface PairLayout {
  direction: "row" | "column";
  first: PictureSize;
  second: PictureSize;
  size: PictureSize;
}

export const pairLabelPixels = 24;
export const pairGapPixels = 6;

const longestSidePixels = 1568;
const largestAreaPixels = 1_150_000;
const roomPixels = longestSidePixels - 2 * (pairLabelPixels + pairGapPixels);

function evenPixels(pixels: number): number {
  return Math.max(2, Math.floor(pixels / 2) * 2);
}

function sizeOf(options: { widthPixels: number; shape: number }): PictureSize {
  const widthPixels = evenPixels(options.widthPixels);
  return { widthPixels, heightPixels: evenPixels(widthPixels / options.shape) };
}

function rowOf(options: {
  firstShape: number;
  secondShape: number;
}): PairLayout {
  const widthShare = options.firstShape + options.secondShape;
  const height = Math.min(
    roomPixels / widthShare,
    roomPixels,
    Math.sqrt(largestAreaPixels / widthShare),
  );
  const first = sizeOf({
    widthPixels: height * options.firstShape,
    shape: options.firstShape,
  });
  const second = sizeOf({
    widthPixels: height * options.secondShape,
    shape: options.secondShape,
  });
  return {
    direction: "row",
    first,
    second,
    size: {
      widthPixels: first.widthPixels + second.widthPixels + 3 * pairGapPixels,
      heightPixels:
        Math.max(first.heightPixels, second.heightPixels) +
        pairLabelPixels +
        2 * pairGapPixels,
    },
  };
}

function columnOf(options: {
  firstShape: number;
  secondShape: number;
}): PairLayout {
  const heightShare = 1 / options.firstShape + 1 / options.secondShape;
  const width = Math.min(
    roomPixels / heightShare,
    roomPixels,
    Math.sqrt(largestAreaPixels / heightShare),
  );
  const first = sizeOf({ widthPixels: width, shape: options.firstShape });
  const second = sizeOf({ widthPixels: width, shape: options.secondShape });
  return {
    direction: "column",
    first,
    second,
    size: {
      widthPixels:
        Math.max(first.widthPixels, second.widthPixels) + 2 * pairGapPixels,
      heightPixels:
        first.heightPixels +
        second.heightPixels +
        2 * pairLabelPixels +
        3 * pairGapPixels,
    },
  };
}

function areaOf(size: PictureSize): number {
  return size.widthPixels * size.heightPixels;
}

export function pairLayoutOf(options: {
  firstShape: number;
  secondShape: number;
  firstWidthPixels: number;
}): PairLayout {
  const row = rowOf(options);
  if (row.first.widthPixels >= options.firstWidthPixels) return row;
  const column = columnOf(options);
  return areaOf(row.first) >= areaOf(column.first) ? row : column;
}
