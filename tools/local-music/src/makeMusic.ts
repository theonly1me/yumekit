import { arrange } from "./compose/arrange.ts";
import { energyAt, sampleRate, timingOf } from "./compose/timing.ts";
import { finishMix } from "./mix/master.ts";
import { mixScore, type Stereo } from "./mix/mixScore.ts";
import type { StyleDefinition } from "./styles/styleTypes.ts";

export const defaultEnergy = [0.35, 0.55, 0.75, 0.8] as const;

export interface MusicRequest {
  style: StyleDefinition;
  tempo: number;
  durationSeconds: number;
  seed: number;
  energy: readonly number[];
}

export interface Music extends Stereo {
  sampleRate: number;
}

export function makeMusic(request: MusicRequest): Music {
  const { style, energy } = request;
  const timing = timingOf(request);
  const notes = arrange({ style, timing, seed: request.seed, energy });
  const stereo = mixScore({
    notes,
    style,
    timing,
    energyAt: (seconds) =>
      energyAt({ energy, share: seconds / timing.durationSeconds }),
  });
  finishMix({ ...stereo, brightnessHertz: style.brightnessHertz });
  return { ...stereo, sampleRate };
}
