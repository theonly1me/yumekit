const ones = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const tens = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];
const groups = ["", "thousand", "million", "billion"];
const ordinalEndings: Record<string, string> = {
  one: "first",
  two: "second",
  three: "third",
  five: "fifth",
  eight: "eighth",
  nine: "ninth",
  twelve: "twelfth",
};

function belowHundred(value: number): string {
  if (value < 20) return ones[value] ?? "";
  const unit = value % 10;
  const ten = tens[Math.floor(value / 10)] ?? "";
  return unit === 0 ? ten : `${ten} ${ones[unit] ?? ""}`;
}

function belowThousand(value: number): string {
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const parts = hundreds > 0 ? [`${ones[hundreds] ?? ""} hundred`] : [];
  if (rest > 0) parts.push(belowHundred(rest));
  return parts.join(" ");
}

export function wholeNumberWords(value: number): string {
  if (value === 0) return "zero";
  const parts: string[] = [];
  let rest = value;
  for (const group of groups) {
    const part = rest % 1000;
    if (part > 0)
      parts.unshift(
        group ? `${belowThousand(part)} ${group}` : belowThousand(part),
      );
    rest = Math.floor(rest / 1000);
    if (rest === 0) break;
  }
  return parts.join(" ");
}

function yearWords(value: number): string {
  if (value >= 2000 && value < 2010) return wholeNumberWords(value);
  const first = Math.floor(value / 100);
  const second = value % 100;
  if (second === 0) return `${belowHundred(first)} hundred`;
  const secondWords =
    second < 10 ? `oh ${ones[second] ?? ""}` : belowHundred(second);
  return `${belowHundred(first)} ${secondWords}`;
}

function ordinalWords(value: number): string {
  const words = wholeNumberWords(value).split(" ");
  const last = words.pop() ?? "";
  const ending =
    ordinalEndings[last] ??
    (last.endsWith("y") ? `${last.slice(0, -1)}ieth` : `${last}th`);
  return [...words, ending].join(" ");
}

function digitWords(digits: string): string {
  const words: string[] = [];
  for (const digit of digits) words.push(ones[Number(digit)] ?? "");
  return words.join(" ");
}

function numberWords(text: string): string {
  const [whole = "", fraction] = text.replaceAll(",", "").split(".");
  const value = Number(whole);
  const wholeWords =
    !text.includes(",") &&
    whole.length === 4 &&
    value >= 1100 &&
    value < 2100 &&
    fraction === undefined
      ? yearWords(value)
      : wholeNumberWords(value);
  return fraction === undefined
    ? wholeWords
    : `${wholeWords} point ${digitWords(fraction)}`;
}

function moneyWords(text: string): string {
  const [whole = "", cents] = text.replaceAll(",", "").split(".");
  const dollars = Number(whole);
  const dollarWords = `${wholeNumberWords(dollars)} ${dollars === 1 ? "dollar" : "dollars"}`;
  const centValue =
    cents === undefined ? 0 : Number(cents.padEnd(2, "0").slice(0, 2));
  if (centValue === 0) return dollarWords;
  return `${dollarWords} and ${wholeNumberWords(centValue)} ${centValue === 1 ? "cent" : "cents"}`;
}

const numberPattern = String.raw`\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?`;

export function withSpokenNumbers(text: string): string {
  return text
    .replace(new RegExp(String.raw`\$(?:${numberPattern})`, "g"), (match) =>
      moneyWords(match.slice(1)),
    )
    .replace(
      new RegExp(String.raw`(?:${numberPattern})\s?%`, "g"),
      (match) => `${numberWords(match.replace(/\s?%$/, ""))} percent`,
    )
    .replace(/\b\d+(?:st|nd|rd|th)\b/g, (match) =>
      ordinalWords(Number.parseInt(match, 10)),
    )
    .replace(new RegExp(numberPattern, "g"), (amount) => numberWords(amount));
}
