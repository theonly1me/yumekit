import type { MediaToolRun } from "@yumekit/tools";

export function sourceCostOf(run: MediaToolRun) {
  const { cost, result } = run;
  if (cost !== undefined) {
    return { costUsd: cost.usd, costIsEstimate: cost.basis !== "reported" };
  }
  return {
    ...(result.cost_usd === undefined ? {} : { costUsd: result.cost_usd }),
    ...(result.cost_is_estimate === undefined
      ? {}
      : { costIsEstimate: result.cost_is_estimate }),
  };
}

export function wireCostOf(run: MediaToolRun) {
  const { cost } = run;
  if (cost === undefined) return { cost_usd: 0 };
  return {
    cost_usd: cost.usd,
    cost_is_estimate: cost.basis !== "reported",
    ...(cost.basis === "cautious" ? { price_not_known: true } : {}),
  };
}

export function costTextOf(run: MediaToolRun): string {
  const { cost } = run;
  if (cost === undefined) return "It was free.";
  if (cost.basis === "cautious") {
    return `The model has no known price, so yumekit counted a cautious ${cost.usd.toFixed(2)} US dollars.`;
  }
  const about = cost.basis === "reported" ? "" : "about ";
  return `It cost ${about}${cost.usd.toFixed(cost.usd < 0.1 ? 4 : 2)} US dollars.`;
}
