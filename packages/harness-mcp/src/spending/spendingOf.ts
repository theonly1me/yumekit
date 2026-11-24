import type { MediaTools } from "@yumekit/tools";

export type WireSpending =
  | {
      limit_usd: number;
      spent_usd: number;
      remaining_usd: number;
      paid_calls: number;
    }
  | { record_not_valid: string };

export async function spendingOf(
  mediaTools: MediaTools,
): Promise<WireSpending> {
  const read = await mediaTools.spending();
  if (!read.ok) return { record_not_valid: read.failure.message };
  const { limitUsd, spentUsd, remainingUsd, paidCalls } = read.value;
  return {
    limit_usd: limitUsd,
    spent_usd: spentUsd,
    remaining_usd: remainingUsd,
    paid_calls: paidCalls,
  };
}

export function spendingLineOf(spending: WireSpending): string {
  if ("record_not_valid" in spending) {
    return `Spending: the record is not valid (${spending.record_not_valid}), so paid calls stop.`;
  }
  return `Spending: about ${spending.spent_usd.toFixed(2)} of ${spending.limit_usd.toFixed(2)} US dollars used, ${spending.remaining_usd.toFixed(2)} left. Only the person can change the limit, in Settings.`;
}
