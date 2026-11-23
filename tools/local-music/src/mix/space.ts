import { sampleRate } from "../compose/timing.ts";
import { filterInPlace } from "./filters.ts";

const combLengths = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const passLengths = [556, 441, 341, 225];
const stereoSpread = 23;
const inputGain = 0.015;

interface Line {
  buffer: Float32Array;
  position: number;
  store: number;
}

function lineOf(length: number): Line {
  const scaled = Math.round((length * sampleRate) / 44100);
  return { buffer: new Float32Array(scaled), position: 0, store: 0 };
}

function reverbChannel(options: {
  send: Float32Array;
  spread: number;
  feedback: number;
  damping: number;
}): Float32Array {
  const combs = combLengths.map((length) => lineOf(length + options.spread));
  const passes = passLengths.map((length) => lineOf(length + options.spread));
  const output = new Float32Array(options.send.length);
  for (let index = 0; index < output.length; index += 1) {
    const input = (options.send[index] ?? 0) * inputGain;
    let sum = 0;
    for (const comb of combs) {
      const delayed = comb.buffer[comb.position] ?? 0;
      comb.store =
        delayed * (1 - options.damping) + comb.store * options.damping;
      comb.buffer[comb.position] = input + comb.store * options.feedback;
      comb.position = (comb.position + 1) % comb.buffer.length;
      sum += delayed;
    }
    for (const pass of passes) {
      const delayed = pass.buffer[pass.position] ?? 0;
      pass.buffer[pass.position] = sum + delayed * 0.5;
      pass.position = (pass.position + 1) % pass.buffer.length;
      sum = delayed - sum;
    }
    output[index] = sum;
  }
  return output;
}

export function addReverb(options: {
  send: Float32Array;
  left: Float32Array;
  right: Float32Array;
  roomSize: number;
  damping: number;
  gainDecibels: number;
}): void {
  const feedback = options.roomSize * 0.28 + 0.7;
  const damping = options.damping * 0.4;
  const gain = 10 ** (options.gainDecibels / 20);
  const sides = [0, stereoSpread].map((spread) => {
    const wet = reverbChannel({
      send: options.send,
      spread,
      feedback,
      damping,
    });
    filterInPlace({ samples: wet, kind: "highpass", hertz: 260 });
    filterInPlace({ samples: wet, kind: "lowpass", hertz: 6500 });
    return wet;
  });
  const [wetLeft, wetRight] = sides;
  for (let index = 0; index < options.left.length; index += 1) {
    options.left[index] =
      (options.left[index] ?? 0) + (wetLeft?.[index] ?? 0) * gain;
    options.right[index] =
      (options.right[index] ?? 0) + (wetRight?.[index] ?? 0) * gain;
  }
}

export function addDelay(options: {
  send: Float32Array;
  left: Float32Array;
  right: Float32Array;
  delaySeconds: number;
  feedback: number;
}): void {
  const length = Math.round(options.delaySeconds * sampleRate);
  const leftLine = new Float32Array(length);
  const rightLine = new Float32Array(length);
  const smoothing = Math.exp((-2 * Math.PI * 3200) / sampleRate);
  let smoothed = 0;
  for (let index = 0; index < options.left.length; index += 1) {
    const position = index % length;
    const leftOut = leftLine[position] ?? 0;
    const rightOut = rightLine[position] ?? 0;
    smoothed =
      (options.send[index] ?? 0) * (1 - smoothing) + smoothed * smoothing;
    leftLine[position] = smoothed + rightOut * options.feedback;
    rightLine[position] = leftOut * options.feedback;
    options.left[index] = (options.left[index] ?? 0) + leftOut;
    options.right[index] = (options.right[index] ?? 0) + rightOut;
  }
}
