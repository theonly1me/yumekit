import type { SceneWord } from "@yumekit/scene";

export interface TimedWord {
  text: string;
  startFrame: number;
}

const sentenceEnd = /[.!?。！？]$/;

function sortedByStartFrame(words: readonly TimedWord[]): TimedWord[] {
  const sorted: TimedWord[] = [];
  for (const word of words) {
    const laterIndex = sorted.findIndex(
      (placed) => placed.startFrame > word.startFrame,
    );
    sorted.splice(laterIndex === -1 ? sorted.length : laterIndex, 0, word);
  }
  return sorted;
}

function spokenWords(words: readonly SceneWord[]): TimedWord[] {
  return sortedByStartFrame(
    words
      .map((word) => ({ text: word.text.trim(), startFrame: word.startFrame }))
      .filter((word) => word.text !== "" && Number.isFinite(word.startFrame)),
  );
}

function evenlySpreadWords(options: {
  text: string;
  durationFrames: number;
}): TimedWord[] {
  const texts = options.text.split(/\s+/).filter((text) => text !== "");
  return [...texts.entries()].map(([index, text]) => ({
    text,
    startFrame: Math.floor((index * options.durationFrames) / texts.length),
  }));
}

export function timedWordsOf(options: {
  words: readonly SceneWord[] | undefined;
  text: string | undefined;
  durationFrames: number;
}): TimedWord[] {
  const spoken = spokenWords(options.words ?? []);
  if (spoken.length > 0) {
    return spoken;
  }
  return evenlySpreadWords({
    text: options.text ?? "",
    durationFrames: options.durationFrames,
  });
}

export function pagesOf(options: {
  words: readonly TimedWord[];
  maxCharacters: number;
}): TimedWord[][] {
  const pages: TimedWord[][] = [];
  let page: TimedWord[] = [];
  let pageCharacters = 0;
  for (const word of options.words) {
    const nextCharacters =
      pageCharacters === 0
        ? word.text.length
        : pageCharacters + 1 + word.text.length;
    if (page.length > 0 && nextCharacters > options.maxCharacters) {
      pages.push(page);
      page = [];
    }
    page.push(word);
    pageCharacters = page.length === 1 ? word.text.length : nextCharacters;
    if (sentenceEnd.test(word.text)) {
      pages.push(page);
      page = [];
      pageCharacters = 0;
    }
  }
  if (page.length > 0) {
    pages.push(page);
  }
  return pages;
}

export function pageAt(options: {
  pages: readonly TimedWord[][];
  frame: number;
}): TimedWord[] | undefined {
  return options.pages.findLast(
    ([firstWord]) =>
      firstWord !== undefined && firstWord.startFrame <= options.frame,
  );
}
