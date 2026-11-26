import type { MediaModel, MediaModelPrice } from "../description.js";
import type { JsonObject } from "../types.js";

const spokenWordsInOneSecond = 2.5;

function settingValuesOf(options: {
  model: MediaModel;
  input: JsonObject;
}): Map<string, string> {
  const values = new Map<string, string>();
  for (const setting of options.model.settings) {
    if ("default" in setting) values.set(setting.name, String(setting.default));
  }
  for (const [name, value] of Object.entries(options.input)) {
    if (typeof value !== "object") values.set(name, String(value));
  }
  return values;
}

function bestMatchOf(options: {
  prices: MediaModelPrice[];
  values: Map<string, string>;
}): MediaModelPrice | undefined {
  const matching = options.prices.filter((price) =>
    Object.entries(price.when).every(
      ([name, value]) => options.values.get(name) === value,
    ),
  );
  return matching.toSorted(
    (...[first, second]) =>
      Object.keys(second.when).length - Object.keys(first.when).length,
  )[0];
}

export function secondsOfCall(options: {
  input: JsonObject;
  expectedSeconds: number | undefined;
}): number | undefined {
  const { input } = options;
  const duration = input["duration_seconds"];
  if (typeof duration === "number") return duration;
  if (options.expectedSeconds !== undefined) return options.expectedSeconds;
  const text = input["text"];
  if (typeof text !== "string") return undefined;
  const words = text.split(/\s+/).filter(Boolean).length;
  return words / spokenWordsInOneSecond;
}

function amountOf(options: {
  price: MediaModelPrice;
  input: JsonObject;
  seconds: number | undefined;
}): number | undefined {
  const { price, input, seconds } = options;
  switch (price.unit) {
    case "image":
    case "call":
      return price.usd;
    case "second":
      return seconds === undefined ? undefined : price.usd * seconds;
    case "minute":
      return seconds === undefined ? undefined : (price.usd * seconds) / 60;
    case "thousand-characters": {
      const text = input["text"];
      return typeof text === "string"
        ? (price.usd * text.length) / 1000
        : undefined;
    }
  }
}

export function priceAtDefaultsOf(
  model: MediaModel,
): MediaModelPrice | undefined {
  return bestMatchOf({
    prices: model.prices,
    values: settingValuesOf({ model, input: {} }),
  });
}

export function catalogPriceOf(options: {
  model: MediaModel;
  input: JsonObject;
  expectedSeconds: number | undefined;
}): number | undefined {
  const { model, input } = options;
  const values = settingValuesOf({ model, input });
  const price = bestMatchOf({ prices: model.prices, values });
  if (price === undefined) return undefined;
  return amountOf({
    price,
    input,
    seconds: secondsOfCall({ input, expectedSeconds: options.expectedSeconds }),
  });
}
