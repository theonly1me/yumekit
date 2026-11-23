import { sampleRate } from "../compose/timing.ts";

function weightedSums(samples: Float32Array): Float64Array {
  const sums = new Float64Array(samples.length + 1);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  let w1 = 0;
  let w2 = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const input = samples[index] ?? 0;
    const shelved =
      1.53512485958697 * input -
      2.69169618940638 * x1 +
      1.19839281085285 * x2 +
      1.69065929318241 * y1 -
      0.73248077421585 * y2;
    const weighted =
      shelved - 2 * y1 + y2 + 1.99004745483398 * w1 - 0.99007225036621 * w2;
    x2 = x1;
    x1 = input;
    y2 = y1;
    y1 = shelved;
    w2 = w1;
    w1 = weighted;
    sums[index + 1] = (sums[index] ?? 0) + weighted * weighted;
  }
  return sums;
}

export function loudnessOf(options: {
  left: Float32Array;
  right: Float32Array;
}): number {
  const channels = [options.left, options.right].map(weightedSums);
  const blockSize = Math.round(0.4 * sampleRate);
  const hop = Math.round(0.1 * sampleRate);
  const blocks: number[] = [];
  for (let start = 0; start + blockSize <= options.left.length; start += hop) {
    let power = 0;
    for (const sums of channels) {
      power +=
        ((sums[start + blockSize] ?? 0) - (sums[start] ?? 0)) / blockSize;
    }
    blocks.push(power);
  }
  const loudness = (power: number) => -0.691 + 10 * Math.log10(power);
  const meanOf = (powers: number[]) =>
    powers.reduce((...[total, power]) => total + power, 0) /
    Math.max(1, powers.length);
  const audible = blocks.filter((power) => loudness(power) > -70);
  const relativeGate = loudness(meanOf(audible)) - 10;
  const gated = audible.filter((power) => loudness(power) > relativeGate);
  return gated.length === 0 ? -Infinity : loudness(meanOf(gated));
}
