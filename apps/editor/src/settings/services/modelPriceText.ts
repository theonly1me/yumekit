export type PriceUnit =
  "second" | "image" | "minute" | "thousand-characters" | "call";

const unitWords: Record<PriceUnit, string> = {
  second: "a second",
  image: "a picture",
  minute: "a minute",
  "thousand-characters": "for 1,000 characters",
  call: "each time",
};

function amountText(usd: number): string {
  const text = (Math.round(usd * 1000) / 1000).toFixed(3);
  return `$${text.endsWith("0") ? text.slice(0, -1) : text}`;
}

export function modelPriceText(options: {
  price: { usd: number; unit: PriceUnit } | null;
  resolution: string | null;
}): string {
  const { price, resolution } = options;
  if (price === null) return "Price not known";
  if (price.usd === 0) return "Free";
  const size = resolution === null ? "" : ` at ${resolution}`;
  return `About ${amountText(price.usd)} ${unitWords[price.unit]}${size}`;
}
