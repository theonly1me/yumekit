import { chanceOf } from "../compose/random.ts";
import { sampleRate } from "../compose/timing.ts";
import type {
  AdditiveSound,
  ElectricPianoSound,
  SawSound,
} from "../styles/styleTypes.ts";
import {
  envelopeOf,
  hertzOf,
  panGainsOf,
  tau,
  writeMono,
  type Voice,
} from "./voice.ts";

const nyquistShare = 0.45;

export function additiveVoice(sound: AdditiveSound): Voice {
  return (request) => {
    const { note } = request;
    const hertz = hertzOf(note.pitch);
    const envelope = envelopeOf({
      attackSeconds: sound.attackSeconds,
      lengthSeconds: note.lengthSeconds,
      releaseSeconds: note.releaseSeconds ?? sound.releaseSeconds,
      decaySeconds: sound.decaySeconds,
    });
    const { drive } = sound;
    const shaping = drive === undefined ? 1 : Math.tanh(drive);
    const vibrato = (sound.vibratoCents ?? 0) / 1200;
    const samples = new Float32Array(envelope.length);
    const audibleHarmonics = Math.min(
      sound.harmonics.length,
      Math.floor((sampleRate * nyquistShare) / hertz),
    );
    let phase = 0;
    for (let index = 0; index < envelope.length; index += 1) {
      const seconds = index / sampleRate;
      const wobble =
        vibrato * Math.min(1, seconds / 0.4) * Math.sin(tau * 5 * seconds);
      phase += (hertz * 2 ** wobble) / sampleRate;
      let value = 0;
      for (let harmonic = 1; harmonic <= audibleHarmonics; harmonic += 1) {
        value +=
          (sound.harmonics[harmonic - 1] ?? 0) *
          Math.exp(-seconds * harmonic * sound.harmonicDamping) *
          Math.sin(tau * phase * harmonic);
      }
      const shaped =
        drive === undefined ? value : Math.tanh(drive * value) / shaping;
      samples[index] = shaped * (envelope[index] ?? 0) * note.velocity;
    }
    writeMono({ request, samples });
  };
}

function polyBlepSaw(options: { phase: number; step: number }): number {
  const { phase, step } = options;
  let value = 2 * phase - 1;
  if (phase < step) {
    const share = phase / step;
    value -= share + share - share * share - 1;
  } else if (phase > 1 - step) {
    const share = (phase - 1) / step;
    value -= share * share + share + share + 1;
  }
  return value;
}

export function sawVoice(sound: SawSound): Voice {
  return (request) => {
    const { note } = request;
    const envelope = envelopeOf({
      attackSeconds: sound.attackSeconds,
      lengthSeconds: note.lengthSeconds,
      releaseSeconds: note.releaseSeconds ?? sound.releaseSeconds,
      decaySeconds: sound.decaySeconds,
    });
    const hertz = hertzOf(note.pitch);
    const detunes = [-1, 0, 1].map(
      (side) => (hertz * 2 ** ((side * sound.detuneCents) / 1200)) / sampleRate,
    );
    const pans = [-0.7, 0, 0.7].map((side) => panGainsOf(side + request.pan));
    const phases = detunes.map((...[, voiceIndex]) =>
      chanceOf({ seed: note.pitch, key: "saw-phase", index: voiceIndex }),
    );
    const { left, right } = request.target;
    const start = Math.round(note.startSeconds * sampleRate);
    const end = Math.min(left.length, start + envelope.length);
    for (let index = start; index < end; index += 1) {
      const gain = ((envelope[index - start] ?? 0) * note.velocity) / 3;
      let leftValue = 0;
      let rightValue = 0;
      detunes.forEach((...[step, voiceIndex]) => {
        const phase = ((phases[voiceIndex] ?? 0) + step * (index - start)) % 1;
        const value = polyBlepSaw({ phase, step }) * gain;
        leftValue += value * (pans[voiceIndex]?.left ?? 1);
        rightValue += value * (pans[voiceIndex]?.right ?? 1);
      });
      left[index] = (left[index] ?? 0) + leftValue;
      right[index] = (right[index] ?? 0) + rightValue;
    }
  };
}

export function electricPianoVoice(sound: ElectricPianoSound): Voice {
  return (request) => {
    const { note } = request;
    const envelope = envelopeOf({
      attackSeconds: 0.003,
      lengthSeconds: note.lengthSeconds,
      releaseSeconds: note.releaseSeconds ?? sound.releaseSeconds,
      decaySeconds: sound.decaySeconds,
    });
    const hertz = hertzOf(note.pitch);
    const samples = new Float32Array(envelope.length);
    const strike = sound.index * (0.5 + note.velocity);
    for (let index = 0; index < envelope.length; index += 1) {
      const seconds = index / sampleRate;
      const brightness = strike * Math.exp(-seconds / 0.32) + 0.22;
      const modulator = Math.sin(tau * hertz * seconds) * brightness;
      const body = Math.sin(tau * hertz * seconds + modulator);
      const tine =
        Math.sin(tau * hertz * 7 * seconds) *
        sound.tine *
        Math.exp(-seconds / 0.025);
      samples[index] =
        (body + tine) * (envelope[index] ?? 0) * note.velocity * 0.7;
    }
    writeMono({
      request: { ...request, pan: request.pan + (note.pitch - 62) / 36 },
      samples,
    });
  };
}
