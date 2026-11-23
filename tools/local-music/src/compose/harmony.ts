import type { Chord } from "./score.ts";

const bassSteps: Record<string, number> = { "0": 0, "5": 7, "8": 12 };

function pitchClassOf(note: number): number {
  return ((note % 12) + 12) % 12;
}

export function chordTonesFrom(options: {
  chord: Chord;
  keyRoot: number;
  low: number;
}): number[] {
  const classes = new Set(
    options.chord.tones.map((tone) =>
      pitchClassOf(options.keyRoot + options.chord.root + tone),
    ),
  );
  const tones: number[] = [];
  for (let note = options.low; note < options.low + 36; note += 1) {
    if (classes.has(pitchClassOf(note))) tones.push(note);
  }
  return tones;
}

export function padVoicingOf(options: {
  chord: Chord;
  keyRoot: number;
  low: number;
}): number[] {
  const count = Math.min(4, options.chord.tones.length);
  return chordTonesFrom(options).slice(0, count);
}

export function bassPitchOf(options: {
  chord: Chord;
  keyRoot: number;
  low: number;
  symbol: string;
}): number {
  const rootClass = pitchClassOf(options.keyRoot + options.chord.root);
  const root = options.low + pitchClassOf(rootClass - options.low);
  if (options.symbol === "3") {
    const third = options.chord.tones[1] ?? 7;
    return root + third;
  }
  return root + (bassSteps[options.symbol] ?? 0);
}

export function chordOfBar(options: {
  progression: readonly Chord[];
  barsPerChord: number;
  bar: number;
}): Chord {
  const index =
    Math.floor(options.bar / options.barsPerChord) % options.progression.length;
  const chord = options.progression[index];
  if (chord === undefined) throw new Error("A progression needs a chord");
  return chord;
}
