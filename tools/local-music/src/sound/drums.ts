import { noiseAt } from "../compose/random.ts";
import { sampleRate } from "../compose/timing.ts";
import type { KickSound } from "../styles/styleTypes.ts";
import { hertzOf, riseCurve, tau, writeMono, type Voice } from "./voice.ts";

interface Drop {
  startHertz: number;
  endHertz: number;
  pitchSeconds: number;
  decaySeconds: number;
  noise: number;
  noiseSeconds: number;
  drive: number;
  lengthSeconds: number;
}

function dropSamples(options: {
  drop: Drop;
  firstSample: number;
}): Float32Array {
  const { drop, firstSample } = options;
  const count = Math.ceil(drop.lengthSeconds * sampleRate);
  const samples = new Float32Array(count);
  const shaping = Math.tanh(drop.drive);
  for (let index = 0; index < count; index += 1) {
    const seconds = index / sampleRate;
    const phase =
      drop.endHertz * seconds +
      (drop.startHertz - drop.endHertz) *
        drop.pitchSeconds *
        (1 - Math.exp(-seconds / drop.pitchSeconds));
    const tail = riseCurve(
      (drop.lengthSeconds - seconds) / (drop.lengthSeconds * 0.25),
    );
    const body =
      Math.sin(tau * phase) *
      riseCurve(seconds / 0.0015) *
      Math.exp(-seconds / drop.decaySeconds) *
      tail;
    const hit =
      noiseAt(firstSample + index) *
      drop.noise *
      riseCurve(seconds / 0.0008) *
      Math.exp(-seconds / drop.noiseSeconds);
    samples[index] = Math.tanh(drop.drive * (body + hit)) / shaping;
  }
  return samples;
}

function dropVoice(dropOf: (pitch: number) => Drop): Voice {
  return (request) => {
    const firstSample = Math.round(request.note.startSeconds * sampleRate);
    const samples = dropSamples({
      drop: dropOf(request.note.pitch),
      firstSample,
    });
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = (samples[index] ?? 0) * request.note.velocity;
    }
    writeMono({ request, samples });
  };
}

export function kickVoice(sound: KickSound): Voice {
  return dropVoice(() => ({
    ...sound,
    noise: sound.click,
    noiseSeconds: 0.0012,
    lengthSeconds: Math.min(0.9, sound.decaySeconds * 3),
  }));
}

export const tomVoice: Voice = dropVoice((pitch) => ({
  startHertz: hertzOf(pitch) * 1.7,
  endHertz: hertzOf(pitch),
  pitchSeconds: 0.04,
  decaySeconds: 0.32,
  noise: 0.12,
  noiseSeconds: 0.01,
  drive: 1.4,
  lengthSeconds: 0.9,
}));

export const boomVoice: Voice = dropVoice(() => ({
  startHertz: 95,
  endHertz: 36,
  pitchSeconds: 0.16,
  decaySeconds: 1.1,
  noise: 0.35,
  noiseSeconds: 0.05,
  drive: 1.8,
  lengthSeconds: 3.2,
}));

interface Burst {
  attackSeconds: number;
  decaySeconds: number;
  lengthSeconds: number;
  claps?: number;
  tone?: { hertz: number; level: number; decaySeconds: number };
}

export function burstVoice(burst: Burst): Voice {
  return (request) => {
    const { note } = request;
    const firstSample = Math.round(note.startSeconds * sampleRate);
    const lengthSeconds = Math.max(
      burst.lengthSeconds,
      note.releaseSeconds ?? 0,
    );
    const decaySeconds = Math.max(
      burst.decaySeconds,
      (note.releaseSeconds ?? 0) / 4,
    );
    const count = Math.ceil(lengthSeconds * sampleRate);
    const samples = new Float32Array(count);
    const claps = burst.claps ?? 0;
    for (let index = 0; index < count; index += 1) {
      const seconds = index / sampleRate;
      let envelope = 0;
      for (let clap = 0; clap < claps; clap += 1) {
        const since = seconds - clap * 0.011;
        if (since >= 0) envelope += Math.exp(-since / 0.0045) * 0.8;
      }
      const tailStart = claps * 0.011;
      if (seconds >= tailStart) {
        envelope +=
          riseCurve((seconds - tailStart) / burst.attackSeconds) *
          Math.exp(-(seconds - tailStart) / decaySeconds);
      }
      const end = riseCurve((lengthSeconds - seconds) / (lengthSeconds * 0.2));
      const tone =
        burst.tone === undefined
          ? 0
          : Math.sin(tau * burst.tone.hertz * seconds) *
            burst.tone.level *
            Math.exp(-seconds / burst.tone.decaySeconds);
      samples[index] =
        (noiseAt(firstSample + index) * envelope + tone) * end * note.velocity;
    }
    writeMono({ request, samples });
  };
}

export const drumVoices: Record<string, Voice> = {
  snare: burstVoice({
    attackSeconds: 0.001,
    decaySeconds: 0.07,
    lengthSeconds: 0.35,
    tone: { hertz: 190, level: 0.55, decaySeconds: 0.05 },
  }),
  clap: burstVoice({
    attackSeconds: 0.002,
    decaySeconds: 0.09,
    lengthSeconds: 0.4,
    claps: 3,
  }),
  rim: burstVoice({
    attackSeconds: 0.0005,
    decaySeconds: 0.004,
    lengthSeconds: 0.08,
    tone: { hertz: 1650, level: 0.7, decaySeconds: 0.014 },
  }),
  hat: burstVoice({
    attackSeconds: 0.0008,
    decaySeconds: 0.032,
    lengthSeconds: 0.12,
  }),
  openHat: burstVoice({
    attackSeconds: 0.002,
    decaySeconds: 0.17,
    lengthSeconds: 0.5,
  }),
  shaker: burstVoice({
    attackSeconds: 0.007,
    decaySeconds: 0.04,
    lengthSeconds: 0.12,
  }),
  crash: burstVoice({
    attackSeconds: 0.002,
    decaySeconds: 0.9,
    lengthSeconds: 2.6,
  }),
  tom: tomVoice,
  boom: boomVoice,
};
