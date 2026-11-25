import { z } from "zod";
import type { MoneyEntry } from "../chatTypes.js";

const raiseStepUsd = 5;

const overMoneyLeftSchema = z.object({
  kind: z.literal("over-money-left"),
  estimate_usd: z.number().nonnegative(),
  left_usd: z.number().nonnegative(),
  limit_usd: z.number().nonnegative(),
  what: z.string().min(1),
  paid_calls: z.number().int().nonnegative(),
  calls_that_fit: z.number().int().nonnegative(),
});

export type MoneyWarning = Omit<MoneyEntry, "kind" | "id" | "choice">;

export function raisedLimitOf(options: {
  limitUsd: number;
  leftUsd: number;
  estimateUsd: number;
}): number {
  const neededCents = Math.round(
    (options.limitUsd - options.leftUsd + options.estimateUsd) * 100,
  );
  return Math.ceil(neededCents / (raiseStepUsd * 100)) * raiseStepUsd;
}

export function moneyWarningOf(result: {
  isError: boolean;
  data: unknown;
}): MoneyWarning | undefined {
  if (!result.isError) return undefined;
  const parsed = overMoneyLeftSchema.safeParse(result.data);
  if (!parsed.success) return undefined;
  const refusal = parsed.data;
  return {
    what: refusal.what,
    estimateUsd: refusal.estimate_usd,
    leftUsd: refusal.left_usd,
    raiseToUsd: raisedLimitOf({
      limitUsd: refusal.limit_usd,
      leftUsd: refusal.left_usd,
      estimateUsd: refusal.estimate_usd,
    }),
    paidCalls: refusal.paid_calls,
    callsThatFit: refusal.calls_that_fit,
  };
}

function dollarsOf(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export function choiceRequestOf(options: {
  entry: MoneyEntry;
  choice: "raise" | "fewer";
}): string {
  const { entry } = options;
  if (options.choice === "raise") {
    return `I raised the money of this project to ${dollarsOf(entry.raiseToUsd)}. Go on with the ${entry.what}.`;
  }
  return `Make fewer ${entry.what}. The ${entry.what} cost about ${dollarsOf(entry.estimateUsd)}, and ${dollarsOf(entry.leftUsd)} is left. Make at most ${String(entry.callsThatFit)}, the ones that matter most for the film, and tell me which ones you leave out.`;
}
