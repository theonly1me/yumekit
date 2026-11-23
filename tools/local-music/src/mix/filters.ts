import { sampleRate } from "../compose/timing.ts";

export type FilterKind = "lowpass" | "highpass" | "bandpass";

export interface Filter {
  setHertz: (hertz: number) => void;
  run: (input: number) => number;
}

export function createFilter(options: {
  kind: FilterKind;
  hertz: number;
  resonance?: number;
}): Filter {
  const damping = 1 / (options.resonance ?? Math.SQRT1_2);
  let first = 0;
  let second = 0;
  let gain = 0;
  let shareOne = 0;
  let shareTwo = 0;
  let shareThree = 0;
  const setHertz = (hertz: number) => {
    const safe = Math.min(sampleRate * 0.45, Math.max(10, hertz));
    gain = Math.tan((Math.PI * safe) / sampleRate);
    shareOne = 1 / (1 + gain * (gain + damping));
    shareTwo = gain * shareOne;
    shareThree = gain * shareTwo;
  };
  setHertz(options.hertz);
  return {
    setHertz,
    run: (input) => {
      const third = input - second;
      const band = shareOne * first + shareTwo * third;
      const low = second + shareTwo * first + shareThree * third;
      first = 2 * band - first;
      second = 2 * low - second;
      if (options.kind === "lowpass") return low;
      if (options.kind === "bandpass") return band;
      return input - damping * band - low;
    },
  };
}

export function filterInPlace(options: {
  samples: Float32Array;
  kind: FilterKind;
  hertz: number | ((sampleIndex: number) => number);
  resonance?: number;
}): void {
  const { samples, hertz } = options;
  const hertzAt = typeof hertz === "number" ? () => hertz : hertz;
  const filter = createFilter({
    kind: options.kind,
    hertz: hertzAt(0),
    ...(options.resonance === undefined
      ? {}
      : { resonance: options.resonance }),
  });
  const movesHertz = typeof hertz !== "number";
  for (let index = 0; index < samples.length; index += 1) {
    if (movesHertz && index % 64 === 0) filter.setHertz(hertzAt(index));
    samples[index] = filter.run(samples[index] ?? 0);
  }
}

export function peakInPlace(options: {
  samples: Float32Array;
  hertz: number;
  gainDecibels: number;
  resonance: number;
}): void {
  const amplitude = 10 ** (options.gainDecibels / 40);
  const omega = (2 * Math.PI * options.hertz) / sampleRate;
  const alpha = Math.sin(omega) / (2 * options.resonance);
  const cosine = Math.cos(omega);
  const norm = 1 + alpha / amplitude;
  const b0 = (1 + alpha * amplitude) / norm;
  const b1 = (-2 * cosine) / norm;
  const b2 = (1 - alpha * amplitude) / norm;
  const a1 = (-2 * cosine) / norm;
  const a2 = (1 - alpha / amplitude) / norm;
  let input1 = 0;
  let input2 = 0;
  let output1 = 0;
  let output2 = 0;
  const { samples } = options;
  for (let index = 0; index < samples.length; index += 1) {
    const input = samples[index] ?? 0;
    const output =
      b0 * input + b1 * input1 + b2 * input2 - a1 * output1 - a2 * output2;
    input2 = input1;
    input1 = input;
    output2 = output1;
    output1 = output;
    samples[index] = output;
  }
}
