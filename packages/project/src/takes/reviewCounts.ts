import type { TakeNote } from "../format/takes.js";
import { noteVerdictsOf } from "./verdicts.js";

export interface ReviewCounts {
  change: number;
  dropped: number;
  question: number;
  use: number;
}

export const noReviewCounts: ReviewCounts = {
  change: 0,
  dropped: 0,
  question: 0,
  use: 0,
};

export function reviewCountsOf(notes: readonly TakeNote[]): ReviewCounts {
  const counts = { ...noReviewCounts };
  for (const verdict of noteVerdictsOf(notes).values()) {
    if (verdict !== "approved") counts[verdict] += 1;
  }
  counts.use = new Set(
    notes.filter((note) => note.use === true).map((note) => note.itemId),
  ).size;
  return counts;
}

export function reviewTotalOf(counts: ReviewCounts): number {
  return counts.change + counts.dropped + counts.question;
}

export function listTextOf(parts: readonly string[]): string {
  const last = parts.at(-1) ?? "";
  if (parts.length < 2) return last;
  const rest = parts.slice(0, -1).join(", ");
  return `${rest}${parts.length > 2 ? "," : ""} and ${last}`;
}

export function reviewCountTextOf(counts: ReviewCounts): string {
  const questions = counts.question === 1 ? "question" : "questions";
  return listTextOf([
    ...(counts.change > 0 ? [`${String(counts.change)} to change`] : []),
    ...(counts.dropped > 0 ? [`${String(counts.dropped)} to leave out`] : []),
    ...(counts.question > 0 ? [`${String(counts.question)} ${questions}`] : []),
    ...(counts.use > 0 ? [`${String(counts.use)} to use`] : []),
  ]);
}
