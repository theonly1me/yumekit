import { sampleRate } from "../compose/timing.ts";

const attackSeconds = 0.006;
const recoverSeconds = 0.16;

export function duckInPlace(options: {
  bus: { left: Float32Array; right: Float32Array };
  kickSeconds: readonly number[];
  depth: number;
}): void {
  const { left, right } = options.bus;
  let kickIndex = -1;
  for (let index = 0; index < left.length; index += 1) {
    const seconds = index / sampleRate;
    while ((options.kickSeconds[kickIndex + 1] ?? Infinity) <= seconds) {
      kickIndex += 1;
    }
    const lastKick = options.kickSeconds[kickIndex];
    if (lastKick === undefined) continue;
    const since = seconds - lastKick;
    const kickBefore = options.kickSeconds[kickIndex - 1];
    const leftover =
      kickBefore === undefined
        ? 0
        : Math.exp(-(seconds - kickBefore - attackSeconds) / recoverSeconds);
    const pull =
      since < attackSeconds
        ? Math.max(leftover, since / attackSeconds)
        : Math.exp(-(since - attackSeconds) / recoverSeconds);
    const gain = 1 - options.depth * pull;
    left[index] = (left[index] ?? 0) * gain;
    right[index] = (right[index] ?? 0) * gain;
  }
}
