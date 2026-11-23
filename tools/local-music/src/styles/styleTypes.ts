import type { Chord, Layer, PartName, TonePart } from "../compose/score.ts";

export interface KickSound {
  startHertz: number;
  endHertz: number;
  pitchSeconds: number;
  decaySeconds: number;
  click: number;
  drive: number;
}

export interface AdditiveSound {
  harmonics: readonly number[];
  harmonicDamping: number;
  attackSeconds: number;
  releaseSeconds: number;
  decaySeconds?: number;
  vibratoCents?: number;
  drive?: number;
}

export interface SawSound {
  detuneCents: number;
  attackSeconds: number;
  releaseSeconds: number;
  decaySeconds?: number;
}

export interface SoftPadSound extends AdditiveSound {
  detuneCents: number;
}

export interface ElectricPianoSound {
  index: number;
  tine: number;
  decaySeconds: number;
  releaseSeconds: number;
}

export interface StyleSounds {
  kick: KickSound;
  bass: AdditiveSound;
  pad: SawSound | SoftPadSound;
  keys?: ElectricPianoSound;
  pluck?: AdditiveSound;
  lead?: AdditiveSound;
  strings?: SawSound | AdditiveSound;
}

export interface PartMix {
  gainDecibels: number;
  pan?: number;
  reverb?: number;
  delay?: number;
  duck?: number;
  highpassHertz?: number;
  lowpassHertz?: number;
  opensWithEnergy?: { lowHertz: number; highHertz: number };
}

export interface StyleDefinition {
  keyRoots: readonly number[];
  progressions: readonly (readonly Chord[])[];
  barsPerChord: number;
  swing: number;
  looseSeconds: number;
  layers: readonly Layer[];
  lift: { riser: boolean; crash: boolean; breathBeforeEnd: boolean };
  ending: readonly PartName[];
  ranges: Partial<Record<TonePart, number>>;
  sounds: StyleSounds;
  mix: Partial<Record<PartName, Partial<PartMix>>>;
  brightnessHertz: number;
  delayBeats: number;
  space: { roomSize: number; damping: number; returnDecibels: number };
}
