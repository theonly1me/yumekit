import type { StartedServer } from "../connectServer.js";
import type { MediaToolRequest } from "../types.js";
import { catalogPriceOf } from "./catalogPrice.js";
import { cautiousPriceOf } from "./cautiousPrice.js";

export type CallPrice =
  { basis: "free" } | { basis: "catalog" | "cautious"; usd: number };

export function priceOfCall(options: {
  connection: StartedServer;
  model: string | undefined;
  request: MediaToolRequest;
}): CallPrice {
  const { connection, request } = options;
  const { description } = connection;
  if (description?.runs === "on-this-computer") return { basis: "free" };
  const modelId =
    options.model ??
    description?.models.find(
      (model) => model.capability === request.capability && model.is_default,
    )?.id;
  const model = description?.models.find(
    (candidate) =>
      candidate.id === modelId && candidate.capability === request.capability,
  );
  const expectedSeconds = request.expectedSeconds;
  const catalogUsd =
    model === undefined
      ? undefined
      : catalogPriceOf({ model, input: request.input, expectedSeconds });
  if (catalogUsd === 0) return { basis: "free" };
  if (catalogUsd !== undefined) return { basis: "catalog", usd: catalogUsd };
  return {
    basis: "cautious",
    usd: cautiousPriceOf({
      capability: request.capability,
      input: request.input,
      expectedSeconds,
    }),
  };
}
