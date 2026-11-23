import { sampleRate } from "../compose/timing.ts";

const lookaheadSeconds = 0.005;
const releaseSeconds = 0.15;

function neededGains(options: {
  left: Float32Array;
  right: Float32Array;
  ceiling: number;
}): Float32Array {
  const needed = new Float32Array(options.left.length);
  for (let index = 0; index < needed.length; index += 1) {
    const peak = Math.max(
      Math.abs(options.left[index] ?? 0),
      Math.abs(options.right[index] ?? 0),
    );
    needed[index] = peak > options.ceiling ? options.ceiling / peak : 1;
  }
  return needed;
}

function forwardMinimum(options: {
  values: Float32Array;
  window: number;
}): Float32Array {
  const { values, window } = options;
  const minimum = new Float32Array(values.length);
  const queue = new Int32Array(values.length);
  let head = 0;
  let tail = 0;
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index] ?? 1;
    while (tail > head && (values[queue[tail - 1] ?? 0] ?? 1) >= value) {
      tail -= 1;
    }
    queue[tail] = index;
    tail += 1;
    while ((queue[head] ?? 0) > index + window) head += 1;
    minimum[index] = values[queue[head] ?? index] ?? 1;
  }
  return minimum;
}

export function limitInPlace(options: {
  left: Float32Array;
  right: Float32Array;
  ceiling: number;
}): void {
  const window = Math.round(lookaheadSeconds * sampleRate);
  const minimum = forwardMinimum({ values: neededGains(options), window });
  const recovery = 1 - Math.exp(-1 / (releaseSeconds * sampleRate));
  let running = 0;
  let gain = 1;
  for (let index = 0; index < minimum.length; index += 1) {
    running += minimum[index] ?? 1;
    if (index > window) running -= minimum[index - window - 1] ?? 1;
    const average = running / Math.min(index + 1, window + 1);
    gain = Math.min(average, gain + (1 - gain) * recovery);
    const left = (options.left[index] ?? 0) * gain;
    const right = (options.right[index] ?? 0) * gain;
    options.left[index] = Math.max(
      -options.ceiling,
      Math.min(options.ceiling, left),
    );
    options.right[index] = Math.max(
      -options.ceiling,
      Math.min(options.ceiling, right),
    );
  }
}
