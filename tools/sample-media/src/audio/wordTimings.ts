export interface WordTiming {
  text: string;
  start_seconds: number;
  end_seconds: number;
}

const microsecondsPerSecond = 1_000_000;

function roundToMicroseconds(seconds: number): number {
  return Math.round(seconds * microsecondsPerSecond) / microsecondsPerSecond;
}

export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export function evenWordTimings(options: {
  words: string[];
  durationSeconds: number;
}): WordTiming[] {
  const { words, durationSeconds } = options;
  return Array.from(words.entries(), ([wordIndex, text]) => ({
    text,
    start_seconds: roundToMicroseconds(
      (durationSeconds * wordIndex) / words.length,
    ),
    end_seconds: roundToMicroseconds(
      (durationSeconds * (wordIndex + 1)) / words.length,
    ),
  }));
}
