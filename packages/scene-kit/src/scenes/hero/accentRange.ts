function plainWordOf(word: string): string {
  return word.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

export interface WordRange {
  first: number;
  last: number;
}

export function accentRangeOf(options: {
  words: readonly string[];
  accentWord: string | undefined;
}): WordRange {
  const lastIndex = Math.max(0, options.words.length - 1);
  const fallback = { first: lastIndex, last: lastIndex };
  const wanted = (options.accentWord ?? "")
    .split(/\s+/)
    .map(plainWordOf)
    .filter((word) => word !== "");
  if (wanted.length === 0) return fallback;
  const plainWords = options.words.map(plainWordOf);
  const first = plainWords.findIndex((...[, start]) =>
    [...wanted.entries()].every(
      ([offset, word]) => plainWords[start + offset] === word,
    ),
  );
  return first === -1 ? fallback : { first, last: first + wanted.length - 1 };
}
