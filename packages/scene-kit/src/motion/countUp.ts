import { tween } from "@yumekit/scene";
import { entryCurve, framesOf } from "./curves.js";
import { formatNumber, fractionDigitsOf } from "./formatNumber.js";

const defaultDurationSeconds = 1.2;

export function countUp(options: {
  frame: number;
  framesPerSecond: number;
  to: number;
  from?: number;
  startFrame?: number;
  durationSeconds?: number;
  fractionDigits?: number;
  prefix?: string | undefined;
  suffix?: string | undefined;
}): { value: number; text: string } {
  const startFrame = options.startFrame ?? 0;
  const value = tween({
    frame: options.frame,
    startFrame,
    endFrame:
      startFrame +
      framesOf({
        seconds: options.durationSeconds ?? defaultDurationSeconds,
        framesPerSecond: options.framesPerSecond,
      }),
    from: options.from ?? 0,
    to: options.to,
    easing: entryCurve,
  });
  return {
    value,
    text: formatNumber({
      value,
      fractionDigits: options.fractionDigits ?? fractionDigitsOf(options.to),
      prefix: options.prefix,
      suffix: options.suffix,
    }),
  };
}
