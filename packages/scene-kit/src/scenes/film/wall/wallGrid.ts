export interface WallCell {
  left: number;
  top: number;
  width: number;
  height: number;
}

function cellWidthFor(options: {
  count: number;
  columns: number;
  width: number;
  height: number;
  gap: number;
  aspect: number;
}): number {
  const { count, columns, width, height, gap, aspect } = options;
  const rows = Math.ceil(count / columns);
  const byWidth = (width - gap * (columns - 1)) / columns;
  const byHeight = ((height - gap * (rows - 1)) / rows) * aspect;
  return Math.max(0, Math.min(byWidth, byHeight));
}

const fullRowsShareOfBest = 0.75;

function bestColumnsOf(options: {
  count: number;
  width: number;
  height: number;
  gap: number;
  aspect: number;
  candidates: number[];
}): number {
  const widthOf = (columns: number) => cellWidthFor({ ...options, columns });
  const largest = Math.max(...options.candidates.map(widthOf));
  const fullRows = options.candidates.filter(
    (columns) =>
      options.count % columns === 0 &&
      widthOf(columns) >= fullRowsShareOfBest * largest,
  );
  const choices = fullRows.length > 0 ? fullRows : options.candidates;
  return choices.reduce(
    (...[best, candidate]) =>
      widthOf(candidate) > widthOf(best) ? candidate : best,
    choices[0] ?? 1,
  );
}

export function wallCellsOf(options: {
  count: number;
  columns: number | undefined;
  width: number;
  height: number;
  gap: number;
  aspect: number;
}): { cells: WallCell[]; columns: number; height: number } {
  const { count, width, height, gap, aspect } = options;
  const candidates = Array.from({ length: count }, (...[, index]) => index + 1);
  const columns =
    options.columns === undefined
      ? bestColumnsOf({ ...options, candidates })
      : Math.min(count, options.columns);
  const cellWidth = cellWidthFor({
    count,
    columns,
    width,
    height,
    gap,
    aspect,
  });
  const cellHeight = cellWidth / aspect;
  const cells = Array.from({ length: count }, (...[, index]) => ({
    left: (index % columns) * (cellWidth + gap),
    top: Math.floor(index / columns) * (cellHeight + gap),
    width: cellWidth,
    height: cellHeight,
  }));
  const rows = Math.ceil(count / columns);
  return {
    cells,
    columns,
    height: Math.max(0, rows * cellHeight + (rows - 1) * gap),
  };
}
