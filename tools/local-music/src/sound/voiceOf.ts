import type { PartName } from "../compose/score.ts";
import type { StyleSounds } from "../styles/styleTypes.ts";
import { drumVoices, kickVoice } from "./drums.ts";
import { riserVoice } from "./riser.ts";
import { additiveVoice, electricPianoVoice, sawVoice } from "./tones.ts";
import { softPadVoice } from "./softPad.ts";
import type { Voice } from "./voice.ts";

const plainPluck = {
  harmonics: [1, 0.45, 0.25, 0.12, 0.06],
  harmonicDamping: 2.5,
  attackSeconds: 0.002,
  releaseSeconds: 0.12,
  decaySeconds: 0.5,
};

const plainLead = {
  harmonics: [1, 0.3, 0.12, 0.05],
  harmonicDamping: 0,
  attackSeconds: 0.03,
  releaseSeconds: 0.25,
  vibratoCents: 10,
};

const plainStrings = {
  detuneCents: 8,
  attackSeconds: 0.01,
  releaseSeconds: 0.08,
  decaySeconds: 0.3,
};

const plainKeys = {
  index: 1.2,
  tine: 0.12,
  decaySeconds: 1.4,
  releaseSeconds: 0.15,
};

export function voiceOf(options: {
  part: PartName;
  sounds: StyleSounds;
}): Voice {
  const { part, sounds } = options;
  if (part === "kick") return kickVoice(sounds.kick);
  if (part === "riser") return riserVoice;
  if (part === "bass") return additiveVoice(sounds.bass);
  if (part === "pad") {
    return "harmonics" in sounds.pad
      ? softPadVoice(sounds.pad)
      : sawVoice(sounds.pad);
  }
  if (part === "keys") return electricPianoVoice(sounds.keys ?? plainKeys);
  if (part === "pluck") return additiveVoice(sounds.pluck ?? plainPluck);
  if (part === "lead") return additiveVoice(sounds.lead ?? plainLead);
  if (part === "strings") {
    const strings = sounds.strings ?? plainStrings;
    return "harmonics" in strings ? additiveVoice(strings) : sawVoice(strings);
  }
  const drum = drumVoices[part];
  if (drum === undefined) throw new Error(`No voice for ${part}`);
  return drum;
}
