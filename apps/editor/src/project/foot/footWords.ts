import type { Take, TakeStep } from "../takes/takeTypes.js";

export const markHint =
  "Mark only what needs a change. Everything else counts as approved.";

export const sendReviewLabel = "Send the review to the lead";

const nextStepNames: Record<TakeStep, string> = {
  story: "Make the pictures",
  pictures: "Make the clips",
  clips: "Make the cut",
  cut: "Approve the cut",
};

export function notesLabelOf(count: number): string {
  return `Send ${String(count)} ${count === 1 ? "note" : "notes"} to the lead`;
}

export function moneyOf(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}

export function upperFirst(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

export function allGoodLabelOf(take: Take): string {
  const estimate = take.nextStepEstimateUsd ?? 0;
  const price = estimate > 0 ? `, about ${moneyOf(estimate)}` : "";
  return `All good. ${nextStepNames[take.step]}${price}`;
}

export function costLineOf(takeCost: number): string {
  return takeCost > 0 ? ` This take cost ${moneyOf(takeCost)}.` : "";
}
