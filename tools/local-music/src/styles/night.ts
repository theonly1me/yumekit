import { major, majorSeventh, minorNinth, minorSeventh } from "./chords.ts";
import type { StyleDefinition } from "./styleTypes.ts";

export const night: StyleDefinition = {
  keyRoots: [9, 4, 2],
  progressions: [
    [
      { root: 0, tones: minorSeventh },
      { root: 8, tones: majorSeventh },
      { root: 5, tones: minorSeventh },
      { root: 7, tones: minorSeventh },
    ],
    [
      { root: 0, tones: minorNinth },
      { root: 10, tones: major },
      { root: 8, tones: majorSeventh },
      { root: 10, tones: major },
    ],
  ],
  barsPerChord: 1,
  swing: 0.08,
  looseSeconds: 0.005,
  layers: [
    { part: "pad", from: 0, steps: ["c---------------"] },
    { part: "bass", from: 0.2, until: 0.6, steps: ["0---------------"] },
    { part: "bass", from: 0.6, steps: ["0-----------0-5-"] },
    {
      part: "kick",
      from: 0.3,
      steps: ["x.........x....."],
      fill: "x.........x..x.x",
    },
    {
      part: "snare",
      from: 0.45,
      steps: ["........x......."],
      fill: "........x.....xo",
    },
    { part: "hat", from: 0.2, until: 0.65, steps: ["x.o.x.o.x.o.x.o."] },
    { part: "hat", from: 0.65, steps: ["xoxoxoxoxoxoxoxo"] },
    {
      part: "pluck",
      from: 0.45,
      steps: ["0.....2.....1...", "2.....1.....3..."],
    },
    {
      part: "lead",
      from: 0.8,
      vary: true,
      steps: ["4-------3---2---", "2---3---4-------", "5-----4-----2---"],
    },
  ],
  lift: { riser: true, crash: false, breathBeforeEnd: false },
  ending: ["pad", "bass", "pluck", "kick"],
  ranges: { pad: 52, pluck: 64, lead: 69 },
  sounds: {
    kick: {
      startHertz: 110,
      endHertz: 42,
      pitchSeconds: 0.05,
      decaySeconds: 0.3,
      click: 0.04,
      drive: 1.6,
    },
    bass: {
      harmonics: [1, 0.22, 0.06],
      harmonicDamping: 0,
      attackSeconds: 0.01,
      releaseSeconds: 0.12,
      drive: 1.3,
    },
    pad: { detuneCents: 12, attackSeconds: 1.4, releaseSeconds: 2 },
    pluck: {
      harmonics: [1, 0.5, 0.3, 0.15],
      harmonicDamping: 2,
      attackSeconds: 0.002,
      releaseSeconds: 0.2,
      decaySeconds: 0.6,
    },
    lead: {
      harmonics: [1, 0, 0.25, 0, 0.1],
      harmonicDamping: 0,
      attackSeconds: 0.05,
      releaseSeconds: 0.4,
      vibratoCents: 12,
    },
  },
  mix: {
    pad: {
      gainDecibels: -14,
      reverb: 0.4,
      opensWithEnergy: { lowHertz: 450, highHertz: 2200 },
    },
    pluck: { gainDecibels: -15, delay: 0.4 },
    snare: { gainDecibels: -12, reverb: 0.35 },
    bass: { gainDecibels: -6, duck: 0.2 },
    hat: { gainDecibels: -22 },
  },
  brightnessHertz: 11000,
  delayBeats: 0.75,
  space: { roomSize: 0.85, damping: 0.5, returnDecibels: -3 },
};
