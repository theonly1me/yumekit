import type { MediaToolResult } from "@yumekit/tools";
import { speechSpanOf } from "./speechSpan.js";

type WordTiming = NonNullable<MediaToolResult["words"]>[number];

const pauseAfterComma = 2;
const pauseAfterSentence = 4;

function weightOf(word: string): number {
  const letters = word.replaceAll(/[^\p{L}\p{N}]/gu, "").length;
  return Math.max(1, letters) + 1;
}

function pauseAfter(word: string): number {
  if (/[.!?]["')\]]*$/.test(word)) return pauseAfterSentence;
  if (/[,;:]["')\]]*$/.test(word)) return pauseAfterComma;
  return 0;
}

export function spreadWords(options: {
  text: string;
  startSeconds: number;
  endSeconds: number;
}): WordTiming[] {
  const words = options.text.split(/\s+/).filter((word) => word !== "");
  const parts = words.map((...[word, index]) => ({
    word,
    weight: weightOf(word),
    pause: index === words.length - 1 ? 0 : pauseAfter(word),
  }));
  let total = 0;
  for (const part of parts) total += part.weight + part.pause;
  if (total === 0) return [];
  const secondsPerUnit = (options.endSeconds - options.startSeconds) / total;
  let cursor = options.startSeconds;
  return parts.map((part) => {
    const start = cursor;
    const end = start + part.weight * secondsPerUnit;
    cursor = end + part.pause * secondsPerUnit;
    return { text: part.word, start_seconds: start, end_seconds: end };
  });
}

export async function wordsOfResult(options: {
  capability: string;
  input: Record<string, unknown>;
  result: MediaToolResult;
  serverCanAlign: boolean;
  path: string;
  durationSeconds: number | undefined;
}): Promise<WordTiming[] | undefined> {
  const { result, input, durationSeconds } = options;
  if (result.words !== undefined) return result.words;
  const { text } = input;
  if (
    options.capability !== "speech" ||
    options.serverCanAlign ||
    typeof text !== "string" ||
    durationSeconds === undefined
  )
    return undefined;
  const span = await speechSpanOf(options.path);
  return spreadWords({
    text,
    startSeconds: span?.startSeconds ?? 0,
    endSeconds: span?.endSeconds ?? durationSeconds,
  });
}
