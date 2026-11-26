import type { ChapterCard, FilmChapters } from "./filmChapters.js";

export interface LineStops {
  leftId: string;
  rightNumber: number;
  stops: ChapterCard[];
  current: number;
}

export function lineStopsOf(options: {
  film: FilmChapters;
  leftId: string;
}): LineStops | undefined {
  const { chapters } = options.film;
  const leftIndex = chapters.findIndex((each) => each.id === options.leftId);
  const left = chapters[leftIndex];
  const right = chapters[leftIndex + 1];
  if (left === undefined || right === undefined) return undefined;
  const [firstOfLeft] = left.cards;
  const stops = [...left.cards, ...right.cards].filter(
    (card) => card.shotId !== undefined && card !== firstOfLeft,
  );
  const [firstOfRight] = right.cards;
  return {
    leftId: left.id,
    rightNumber: right.number,
    stops,
    current:
      firstOfRight === undefined
        ? stops.length
        : stops.findIndex((card) => card.clip.id === firstOfRight.clip.id),
  };
}

export function steppedLine(options: {
  line: LineStops;
  by: number;
}): ChapterCard | undefined {
  const { line, by } = options;
  const position = line.current === -1 ? line.stops.length : line.current;
  return line.stops[position + by];
}
