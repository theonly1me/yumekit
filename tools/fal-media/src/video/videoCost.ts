import { matchingPrice, roundedUsd } from "../catalog/prices.ts";
import type { CheckedVideoInput } from "./checkVideoInput.ts";

export function videoCostFields(options: {
  input: CheckedVideoInput;
  durationSeconds: number;
}): { cost_usd?: number; cost_is_estimate?: true } {
  const price = matchingPrice({
    prices: options.input.model.prices,
    values: {
      resolution: options.input.resolution,
      with_audio: String(options.input.withAudio),
    },
  });
  if (price === undefined) return {};
  return {
    cost_usd: roundedUsd(price.usd * options.durationSeconds),
    cost_is_estimate: true,
  };
}
