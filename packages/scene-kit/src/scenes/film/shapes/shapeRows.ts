export interface ShapeBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

function rowSplitsOf(count: number): number[][] {
  if (count <= 1) return [[count]];
  const splits: number[][] = [];
  for (let first = 1; first <= count; first += 1) {
    const rest = count - first;
    if (rest === 0) splits.push([first]);
    else for (const tail of rowSplitsOf(rest)) splits.push([first, ...tail]);
  }
  return splits;
}

function rowsOf(options: { aspects: readonly number[]; split: number[] }) {
  let start = 0;
  return options.split.map((size) => {
    const row = options.aspects.slice(start, start + size);
    start += size;
    return row;
  });
}

function heightFor(options: {
  rows: number[][];
  width: number;
  height: number;
  gap: number;
  labelHeight: number;
}): number {
  const { rows, width, height, gap, labelHeight } = options;
  const byHeight =
    (height - (rows.length - 1) * gap - rows.length * labelHeight) /
    rows.length;
  const byWidth = rows.map((row) => {
    const aspectSum = row.reduce((...[sum, aspect]) => sum + aspect, 0);
    return (width - (row.length - 1) * gap) / aspectSum;
  });
  return Math.max(0, Math.min(byHeight, ...byWidth));
}

export function shapeBoxesOf(options: {
  aspects: readonly number[];
  width: number;
  height: number;
  gap: number;
  labelHeight: number;
}): ShapeBox[] {
  const { aspects, gap, labelHeight } = options;
  const choices = rowSplitsOf(aspects.length).map((split) => {
    const rows = rowsOf({ aspects, split });
    return { rows, itemHeight: heightFor({ ...options, rows }) };
  });
  const best = choices.reduce((...[winner, choice]) =>
    choice.itemHeight > winner.itemHeight ? choice : winner,
  );
  return best.rows.flatMap((...[row, rowIndex]) => {
    let left = 0;
    const top = rowIndex * (best.itemHeight + gap + labelHeight);
    return row.map((aspect) => {
      const box = {
        left,
        top,
        width: best.itemHeight * aspect,
        height: best.itemHeight,
      };
      left += box.width + gap;
      return box;
    });
  });
}
