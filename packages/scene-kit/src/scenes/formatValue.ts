const largestFractionDigits = 2;

export function fractionDigitsOf(value: number): number {
  for (let digits = 0; digits < largestFractionDigits; digits += 1) {
    const scaled = value * 10 ** digits;
    if (Math.abs(scaled - Math.round(scaled)) < 1e-9) {
      return digits;
    }
  }
  return largestFractionDigits;
}

export function formatValue(options: {
  value: number;
  fractionDigits: number;
  prefix: string | undefined;
  suffix: string | undefined;
}): string {
  const number = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: options.fractionDigits,
    maximumFractionDigits: options.fractionDigits,
  }).format(options.value);
  return `${options.prefix ?? ""}${number}${options.suffix ?? ""}`;
}
