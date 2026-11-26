import {
  chaptersOf,
  nextWorkOf,
  takeTitleInTextOf,
  takeTitleOf,
  type Take,
} from "@yumekit/project";
import type { MediaTools } from "@yumekit/tools";
import { z } from "zod";

export const sendNexts = ["go", "fewer", "stop"] as const;

export type SendNext = (typeof sendNexts)[number];

export const sendNextSchema = z.enum(sendNexts).default("go");

function dollarsOf(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export function sendSummaryOf(options: {
  take: Take | undefined;
  storyPlan: Parameters<typeof chaptersOf>[0];
  notes: number;
  next: SendNext;
}): string {
  const { take, notes } = options;
  const name =
    take === undefined
      ? "a take"
      : takeTitleInTextOf({ take, chapters: chaptersOf(options.storyPlan) });
  if (notes > 0) {
    return `You sent ${name} with ${String(notes)} ${notes === 1 ? "note" : "notes"}.`;
  }
  return options.next === "stop"
    ? `You approved ${name}, and stopped there.`
    : `You approved ${name}.`;
}

export async function fewerRequestOf(options: {
  take: Take;
  storyPlan: Parameters<typeof chaptersOf>[0];
  mediaTools: MediaTools;
}): Promise<{ text: string; line: string }> {
  const { take } = options;
  const what = nextWorkOf(take.step);
  const title = takeTitleOf({
    take,
    chapters: chaptersOf(options.storyPlan),
  });
  const spending = await options.mediaTools.spending();
  const left = spending.ok ? spending.value.remainingUsd : 0;
  const estimate = take.nextStepEstimateUsd ?? 0;
  return {
    text: `${title}: all good. Make fewer ${what}.`,
    line: `The person asks for fewer ${what}. The ${what} cost about ${dollarsOf(estimate)}, and ${dollarsOf(left)} is left. Make only what fits in the money left, the ones that matter most for the film, and tell me which ones you leave out.`,
  };
}
