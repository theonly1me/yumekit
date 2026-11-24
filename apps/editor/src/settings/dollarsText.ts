const dollarSign = "$";

export function dollarsText(usd: number): string {
  const cents = Math.round(usd * 100) / 100;
  return `${dollarSign}${cents.toFixed(2)}`;
}
