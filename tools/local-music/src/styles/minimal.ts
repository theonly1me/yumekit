import { major, majorSeventh, minorSeventh } from "./chords.ts";
import type { StyleDefinition } from "./styleTypes.ts";

export const minimal: StyleDefinition = {
  keyRoots: [9, 2, 4],
  progressions: [
    [
      { root: 0, tones: minorSeventh },
      { root: 8, tones: majorSeventh },
      { root: 3, tones: major },
      { root: 10, tones: major },
    ],
    [
      { root: 0, tones: minorSeventh },
      { root: 10, tones: major },
      { root: 8, tones: majorSeventh },
      { root: 10, tones: major },
    ],
  ],
  barsPerChord: 1,
  swing: 0,
  looseSeconds: 0.002,
  layers: [
    { part: "pad", from: 0, steps: ["c---------------"] },
    { part: "kick", from: 0.15, until: 0.3, steps: ["x..............."] },
    { part: "kick", from: 0.3, steps: ["x...x...x...x..."] },
    { part: "hat", from: 0.3, steps: ["..x...x...x...x."] },
    { part: "bass", from: 0.35, steps: ["0-0-0-0-0-0-0-0-"] },
    {
      part: "clap",
      from: 0.45,
      steps: ["....x.......x..."],
      fill: "....x.......x.x.",
    },
    {
      part: "pluck",
      from: 0.6,
      steps: ["0.3.1.4.2.0.3.1.", "0.2.4.1.3.0.2.4."],
    },
  ],
  lift: { riser: false, crash: false, breathBeforeEnd: true },
  ending: ["boom", "kick", "pad", "bass"],
  ranges: { bass: 36, pad: 57, pluck: 69 },
  sounds: {
    kick: {
      startHertz: 155,
      endHertz: 45,
      pitchSeconds: 0.036,
      decaySeconds: 0.13,
      click: 0.2,
      drive: 1.2,
    },
    bass: {
      harmonics: [1, 0.25],
      harmonicDamping: 0,
      attackSeconds: 0.01,
      releaseSeconds: 0.04,
      decaySeconds: 0.33,
    },
    pad: {
      harmonics: [1, 0.3],
      harmonicDamping: 0,
      attackSeconds: 0.35,
      releaseSeconds: 0.6,
      detuneCents: 6,
    },
    pluck: {
      harmonics: [1, 0, 0.4],
      harmonicDamping: 6,
      attackSeconds: 0.002,
      releaseSeconds: 0.05,
      decaySeconds: 0.12,
    },
  },
  mix: {
    kick: { gainDecibels: -3 },
    hat: { gainDecibels: -14, highpassHertz: 3000, lowpassHertz: 13000 },
    clap: { gainDecibels: -10, highpassHertz: 600, lowpassHertz: 7000 },
    bass: { gainDecibels: -9, lowpassHertz: 900 },
    pad: {
      gainDecibels: -20,
      highpassHertz: 120,
      lowpassHertz: 5000,
      reverb: 0.25,
    },
    pluck: { gainDecibels: -15, reverb: 0.2, delay: 0.12, highpassHertz: 300 },
  },
  brightnessHertz: 15000,
  delayBeats: 0.75,
  space: { roomSize: 0.7, damping: 0.5, returnDecibels: -6 },
};
