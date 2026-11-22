import type { MediaModel, ModelPrice } from "../tools/mediaServers.js";
import { secondsOf, type SettingValues } from "./settingValues.js";

export type Price =
  { kind: "free" } | { kind: "about"; usd: number } | { kind: "not-known" };

function matches(options: { price: ModelPrice; values: SettingValues }) {
  return Object.entries(options.price.when).every(
    ([name, value]) => String(options.values[name]) === value,
  );
}

function amountOf(options: {
  price: ModelPrice;
  values: SettingValues;
}): number | undefined {
  const { price } = options;
  const seconds = secondsOf(options.values);
  if (price.unit === "image") return price.usd;
  if (seconds === undefined) return undefined;
  if (price.unit === "second") return price.usd * seconds;
  if (price.unit === "minute") return (price.usd * seconds) / 60;
  return undefined;
}

export function priceOf(options: {
  model: MediaModel;
  values: SettingValues;
}): Price {
  const { values } = options;
  const [price] = options.model.prices
    .filter((candidate) => matches({ price: candidate, values }))
    .sort(
      (...[first, second]) =>
        Object.keys(second.when).length - Object.keys(first.when).length,
    );
  if (price === undefined) return { kind: "not-known" };
  const usd = amountOf({ price, values });
  if (usd === undefined) return { kind: "not-known" };
  return usd === 0 ? { kind: "free" } : { kind: "about", usd };
}

export function dollars(usd: number): string {
  const cents = Math.round(Math.round(usd * 100_000_000) / 1_000_000);
  return `$${(cents / 100).toFixed(2)}`;
}

export function priceText(price: Price): string {
  if (price.kind === "free") return "Free";
  if (price.kind === "about") return `About ${dollars(price.usd)}`;
  return "Price not known";
}
