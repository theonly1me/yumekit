import type { Capability, JsonObject } from "../types.js";
import { secondsOfCall } from "./catalogPrice.js";

export const cautiousPrices = {
  image: { usd: 0.25, unit: "call" },
  speech: { usd: 0.1, unit: "call" },
  align: { usd: 0.05, unit: "call" },
  music: { usd: 0.5, unit: "call" },
  "sound-effect": { usd: 0.25, unit: "call" },
  video: { usd: 2, unit: "second" },
  "talking-clip": { usd: 1, unit: "second" },
  sharper: { usd: 1, unit: "call" },
} as const satisfies Record<
  Capability,
  { usd: number; unit: "call" | "second" }
>;

const secondsWhenNotKnown = 10;

export function cautiousPriceOf(options: {
  capability: Capability;
  input: JsonObject;
  expectedSeconds: number | undefined;
}): number {
  const price = cautiousPrices[options.capability];
  if (price.unit === "call") return price.usd;
  const seconds =
    secondsOfCall({
      input: options.input,
      expectedSeconds: options.expectedSeconds,
    }) ?? secondsWhenNotKnown;
  return price.usd * seconds;
}
