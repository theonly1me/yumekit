export const sampleRate = 48000;
export const stepsInBar = 16;

const shortestTailSeconds = 1.6;

export interface Timing {
  tempo: number;
  durationSeconds: number;
  totalSamples: number;
  beatSeconds: number;
  stepSeconds: number;
  barSeconds: number;
  barsBeforeEnd: number;
  endHitSeconds: number | undefined;
}

export function timingOf(options: {
  tempo: number;
  durationSeconds: number;
}): Timing {
  const { tempo, durationSeconds } = options;
  const beatSeconds = 60 / tempo;
  const barSeconds = beatSeconds * 4;
  const lastBarWithTail = Math.floor(
    (durationSeconds - shortestTailSeconds) / barSeconds,
  );
  const hasEndHit = lastBarWithTail >= 0;
  return {
    tempo,
    durationSeconds,
    totalSamples: Math.round(durationSeconds * sampleRate),
    beatSeconds,
    stepSeconds: beatSeconds / 4,
    barSeconds,
    barsBeforeEnd: hasEndHit
      ? lastBarWithTail
      : Math.ceil(durationSeconds / barSeconds),
    endHitSeconds: hasEndHit ? lastBarWithTail * barSeconds : undefined,
  };
}

export function energyAt(options: {
  energy: readonly number[];
  share: number;
}): number {
  const { energy } = options;
  const position =
    Math.min(1, Math.max(0, options.share)) * (energy.length - 1);
  const lower = Math.floor(position);
  const from = energy[lower] ?? 0;
  const to = energy[Math.min(lower + 1, energy.length - 1)] ?? from;
  return from + (to - from) * (position - lower);
}
