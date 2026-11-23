import type { Note, PartName } from "../compose/score.ts";
import { sampleRate, type Timing } from "../compose/timing.ts";
import { voiceOf } from "../sound/voiceOf.ts";
import type { PartMix, StyleDefinition } from "../styles/styleTypes.ts";
import { duckInPlace } from "./duck.ts";
import { filterInPlace } from "./filters.ts";
import { partDefaults } from "./partDefaults.ts";
import { addDelay, addReverb } from "./space.ts";

export interface Stereo {
  left: Float32Array;
  right: Float32Array;
}

const pitchSpreadParts = new Set<PartName>(["pluck", "lead"]);

function shapeBus(options: {
  bus: Stereo;
  mix: PartMix;
  energyAt: (seconds: number) => number;
}): void {
  const { mix } = options;
  for (const samples of [options.bus.left, options.bus.right]) {
    if (mix.highpassHertz !== undefined) {
      filterInPlace({ samples, kind: "highpass", hertz: mix.highpassHertz });
    }
    if (mix.lowpassHertz !== undefined) {
      filterInPlace({ samples, kind: "lowpass", hertz: mix.lowpassHertz });
    }
    const opens = mix.opensWithEnergy;
    if (opens !== undefined) {
      filterInPlace({
        samples,
        kind: "lowpass",
        hertz: (index) => {
          const seconds = index / sampleRate;
          const drift = 1 + 0.12 * Math.sin((2 * Math.PI * seconds) / 7.3);
          const share = options.energyAt(seconds) ** 1.3;
          return (
            opens.lowHertz * (opens.highHertz / opens.lowHertz) ** share * drift
          );
        },
      });
    }
  }
}

export function mixScore(options: {
  notes: readonly Note[];
  style: StyleDefinition;
  timing: Timing;
  energyAt: (seconds: number) => number;
}): Stereo {
  const { notes, style, timing } = options;
  const total = timing.totalSamples;
  const master = {
    left: new Float32Array(total),
    right: new Float32Array(total),
  };
  const bus = { left: new Float32Array(total), right: new Float32Array(total) };
  const reverbSend = new Float32Array(total);
  const delaySend = new Float32Array(total);
  const kickSeconds = notes
    .filter((note) => note.part === "kick")
    .map((note) => note.startSeconds)
    .toSorted((...[first, second]) => first - second);
  const parts = [...new Set(notes.map((note) => note.part))];
  for (const part of parts) {
    bus.left.fill(0);
    bus.right.fill(0);
    const mix = { ...partDefaults[part], ...style.mix[part] };
    const voice = voiceOf({ part, sounds: style.sounds });
    for (const note of notes) {
      if (note.part !== part) continue;
      const spread = pitchSpreadParts.has(part) ? (note.pitch - 67) / 30 : 0;
      voice({ note, target: bus, pan: (mix.pan ?? 0) + spread });
    }
    shapeBus({ bus, mix, energyAt: options.energyAt });
    if (mix.duck !== undefined && mix.duck > 0) {
      duckInPlace({ bus, kickSeconds, depth: mix.duck });
    }
    const gain = 10 ** (mix.gainDecibels / 20);
    const reverb = mix.reverb ?? 0;
    const delay = mix.delay ?? 0;
    for (let index = 0; index < total; index += 1) {
      const left = (bus.left[index] ?? 0) * gain;
      const right = (bus.right[index] ?? 0) * gain;
      master.left[index] = (master.left[index] ?? 0) + left;
      master.right[index] = (master.right[index] ?? 0) + right;
      const middle = (left + right) / 2;
      reverbSend[index] = (reverbSend[index] ?? 0) + middle * reverb;
      delaySend[index] = (delaySend[index] ?? 0) + middle * delay;
    }
  }
  addDelay({
    send: delaySend,
    ...master,
    delaySeconds: timing.beatSeconds * style.delayBeats,
    feedback: 0.38,
  });
  addReverb({
    send: reverbSend,
    ...master,
    ...style.space,
    gainDecibels: style.space.returnDecibels,
  });
  return master;
}
