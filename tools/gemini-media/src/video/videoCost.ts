import type { Outcome } from "../toolResults.ts";
import { videoModel } from "./videoModel.ts";

const microdollarsPerDollar = 1_000_000;

export function usdPerMillionVideoTokens(
  environment: NodeJS.ProcessEnv,
): Outcome<number, string> {
  const text = environment[videoModel.priceVariable];
  if (text === undefined || text === "") {
    return { ok: true, value: videoModel.usdPerMillionVideoTokens };
  }
  const price = Number(text);
  if (!Number.isFinite(price) || price < 0) {
    return {
      ok: false,
      failure: `${videoModel.priceVariable} must be a number of US dollars of 0 or more. It is "${text}".`,
    };
  }
  return { ok: true, value: price };
}

export function videoCostUsd(options: {
  videoTokens: number;
  usdPerMillionTokens: number;
}): number {
  const usd = (options.videoTokens * options.usdPerMillionTokens) / 1_000_000;
  return Math.round(usd * microdollarsPerDollar) / microdollarsPerDollar;
}
