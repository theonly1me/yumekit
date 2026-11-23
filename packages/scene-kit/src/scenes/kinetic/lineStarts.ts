import type { SceneWord } from "@yumekit/scene";

function wordCountOf(line: string): number {
  return line.split(/\s+/).filter((word) => word !== "").length;
}

export function spokenLineStarts(options: {
  lines: readonly string[];
  words: readonly SceneWord[] | undefined;
}): number[] | undefined {
  const spoken = Float64Array.from(
    (options.words ?? [])
      .filter(
        (word) => word.text.trim() !== "" && Number.isFinite(word.startFrame),
      )
      .map((word) => word.startFrame),
  ).sort();
  const starts: number[] = [];
  let wordIndex = 0;
  for (const line of options.lines) {
    const start = spoken[wordIndex];
    if (start === undefined) return undefined;
    starts.push(start);
    wordIndex += wordCountOf(line);
  }
  return starts;
}

export function activeLineAt(options: {
  starts: readonly number[];
  frame: number;
}): number {
  const reached = options.starts.filter((start) => start <= options.frame);
  return Math.max(0, reached.length - 1);
}
