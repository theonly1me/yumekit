import type { PartName } from "../compose/score.ts";
import type { PartMix } from "../styles/styleTypes.ts";

export const partDefaults: Record<PartName, PartMix> = {
  kick: { gainDecibels: -4 },
  snare: {
    gainDecibels: -12,
    highpassHertz: 140,
    lowpassHertz: 8500,
    reverb: 0.2,
  },
  clap: {
    gainDecibels: -12,
    highpassHertz: 750,
    lowpassHertz: 6000,
    reverb: 0.25,
  },
  rim: {
    gainDecibels: -18,
    highpassHertz: 300,
    lowpassHertz: 7000,
    reverb: 0.15,
  },
  hat: {
    gainDecibels: -22,
    highpassHertz: 7000,
    lowpassHertz: 12500,
    pan: 0.25,
  },
  openHat: {
    gainDecibels: -25,
    highpassHertz: 6000,
    lowpassHertz: 12000,
    pan: 0.25,
  },
  shaker: {
    gainDecibels: -25,
    highpassHertz: 4200,
    lowpassHertz: 9000,
    pan: -0.3,
  },
  tom: { gainDecibels: -9, lowpassHertz: 4000, reverb: 0.25 },
  boom: { gainDecibels: -6, lowpassHertz: 2500, reverb: 0.3 },
  crash: {
    gainDecibels: -25,
    highpassHertz: 3500,
    lowpassHertz: 10500,
    reverb: 0.2,
  },
  riser: { gainDecibels: -21, reverb: 0.35 },
  bass: { gainDecibels: -7, highpassHertz: 30, lowpassHertz: 800 },
  pad: {
    gainDecibels: -15,
    highpassHertz: 160,
    reverb: 0.3,
  },
  keys: {
    gainDecibels: -11,
    highpassHertz: 110,
    lowpassHertz: 7000,
    reverb: 0.2,
  },
  pluck: {
    gainDecibels: -14,
    highpassHertz: 220,
    lowpassHertz: 7000,
    reverb: 0.18,
    delay: 0.22,
  },
  strings: {
    gainDecibels: -12,
    highpassHertz: 70,
    lowpassHertz: 2600,
    reverb: 0.25,
  },
  lead: {
    gainDecibels: -15,
    highpassHertz: 250,
    lowpassHertz: 6500,
    reverb: 0.25,
    delay: 0.25,
  },
};
