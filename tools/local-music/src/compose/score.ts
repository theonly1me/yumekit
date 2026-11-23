export const drumParts = [
  "kick",
  "snare",
  "clap",
  "rim",
  "hat",
  "openHat",
  "shaker",
  "tom",
  "boom",
  "crash",
  "riser",
] as const;

export const toneParts = [
  "bass",
  "pad",
  "keys",
  "pluck",
  "strings",
  "lead",
] as const;

export type DrumPart = (typeof drumParts)[number];
export type TonePart = (typeof toneParts)[number];
export type PartName = DrumPart | TonePart;

export interface Note {
  part: PartName;
  startSeconds: number;
  lengthSeconds: number;
  releaseSeconds?: number;
  pitch: number;
  velocity: number;
}

export interface Chord {
  root: number;
  tones: readonly number[];
}

export interface Layer {
  part: PartName;
  from: number;
  until?: number;
  steps: readonly string[];
  vary?: boolean;
  turn?: string;
  fill?: string;
}
