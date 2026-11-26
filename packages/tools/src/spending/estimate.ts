import type { MediaDefault } from "../configuration.js";
import type { KeyHealth } from "../keyHealth/keyHealth.js";
import { selectServer } from "../selectServer.js";
import { keyNotWorkingFailureOf } from "../serverOrder.js";
import { missingKeyFailureOf, type ServerPool } from "../serverPool.js";
import type { Capability, MediaToolRequest, Outcome } from "../types.js";
import type { SpendingRecordNotValid } from "./ledger.js";
import { priceOfCall } from "./priceOfCall.js";
import { roundedUsd, type SpendingBook } from "./spendingBook.js";

export type PricedRequest = Pick<
  MediaToolRequest,
  "capability" | "server" | "model" | "input" | "expectedSeconds"
>;

export interface MoneyEstimate {
  usd: number;
  pricesUsd: number[];
  limitUsd: number;
  spentUsd: number;
  leftUsd: number;
}

export interface EstimateContext {
  pool: ServerPool;
  defaults: () => Partial<Record<Capability, MediaDefault>>;
  keyHealth: KeyHealth;
  spendingBook: SpendingBook;
}

async function priceOfRequest(options: {
  context: EstimateContext;
  request: PricedRequest;
}): Promise<number> {
  const { context, request } = options;
  const selected = await selectServer({
    connections: context.pool.connections(),
    defaults: context.defaults(),
    request,
    keyHealth: context.keyHealth,
  });
  if (!selected.ok) return 0;
  const { connection, model } = selected.value;
  const keyFailure =
    (await missingKeyFailureOf(connection)) ??
    keyNotWorkingFailureOf({ connection, keyHealth: context.keyHealth });
  if (keyFailure !== undefined) return 0;
  const price = priceOfCall({ connection, model, request });
  return price.basis === "free" ? 0 : price.usd;
}

export async function estimateRequests(options: {
  context: EstimateContext;
  requests: PricedRequest[];
}): Promise<Outcome<MoneyEstimate, SpendingRecordNotValid>> {
  const { context } = options;
  const summary = await context.spendingBook.summary();
  if (!summary.ok) return summary;
  const pricesUsd = await Promise.all(
    options.requests.map((request) => priceOfRequest({ context, request })),
  );
  const { limitUsd, spentUsd } = summary.value;
  const heldUsd = context.spendingBook.heldUsd();
  return {
    ok: true,
    value: {
      usd: roundedUsd(pricesUsd.reduce((...[total, usd]) => total + usd, 0)),
      pricesUsd,
      limitUsd,
      spentUsd: roundedUsd(spentUsd + heldUsd),
      leftUsd: roundedUsd(Math.max(0, limitUsd - spentUsd - heldUsd)),
    },
  };
}
