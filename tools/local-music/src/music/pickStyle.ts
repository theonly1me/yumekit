import { styleFromPrompt, type StyleEntry } from "../styles/styleList.ts";
import type { Outcome } from "../toolResults.ts";

export function pickStyle(options: {
  offered: readonly StyleEntry[];
  style: string | undefined;
  prompt: string;
}): Outcome<StyleEntry, string> {
  const names = options.offered.map((entry) => entry.id).join(", ");
  if (options.style === undefined) {
    const fromPrompt = styleFromPrompt(options);
    return fromPrompt === undefined
      ? { ok: false, failure: "This server offers no style yet." }
      : { ok: true, value: fromPrompt };
  }
  const named = options.offered.find((entry) => entry.id === options.style);
  return named === undefined
    ? {
        ok: false,
        failure: `The style "${options.style}" is not offered. Pick one of: ${names}.`,
      }
    : { ok: true, value: named };
}
