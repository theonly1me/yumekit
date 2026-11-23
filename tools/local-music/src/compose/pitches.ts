import type { StyleDefinition } from "../styles/styleTypes.ts";
import { bassPitchOf, chordTonesFrom, padVoicingOf } from "./harmony.ts";
import type { Chord, PartName, TonePart } from "./score.ts";

const defaultLows: Record<TonePart, number> = {
  bass: 28,
  pad: 55,
  keys: 52,
  pluck: 64,
  strings: 38,
  lead: 69,
};

const tomPitches: Record<string, number> = { "1": 52, "2": 47, "3": 43 };

function isTonePart(part: PartName): part is TonePart {
  return part in defaultLows;
}

export function pitchesOf(options: {
  style: StyleDefinition;
  part: PartName;
  symbol: string;
  chord: Chord;
  keyRoot: number;
}): number[] {
  const { part, symbol, chord, keyRoot } = options;
  if (!isTonePart(part)) return [tomPitches[symbol] ?? 48];
  const low = options.style.ranges[part] ?? defaultLows[part];
  if (part === "bass") {
    return [bassPitchOf({ chord, keyRoot, low, symbol })];
  }
  if (symbol === "c") return padVoicingOf({ chord, keyRoot, low });
  const tones = chordTonesFrom({ chord, keyRoot, low });
  const tone = tones[Number(symbol)];
  return tone === undefined ? [] : [tone];
}
