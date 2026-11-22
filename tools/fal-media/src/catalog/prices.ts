export interface ModelPrice {
  usd: number;
  unit: "second" | "image";
  when: Readonly<Record<string, string>>;
}

export function perSecondByResolution(
  usdByResolution: Readonly<Record<string, number>>,
): ModelPrice[] {
  return Object.entries(usdByResolution).map(([resolution, usd]) => ({
    usd,
    unit: "second",
    when: { resolution },
  }));
}

export function matchingPrice(options: {
  prices: readonly ModelPrice[];
  values: Readonly<Record<string, string>>;
}): ModelPrice | undefined {
  const matches = options.prices.filter((price) =>
    Object.entries(price.when).every(
      ([name, value]) => options.values[name] === value,
    ),
  );
  return matches.sort(
    (...[first, second]) =>
      Object.keys(second.when).length - Object.keys(first.when).length,
  )[0];
}

export function roundedUsd(usd: number): number {
  return Math.round(usd * 10_000) / 10_000;
}
