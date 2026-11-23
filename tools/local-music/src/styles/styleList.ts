import { bright } from "./bright.ts";
import { cinematic } from "./cinematic.ts";
import { minimal } from "./minimal.ts";
import { night } from "./night.ts";
import type { StyleDefinition } from "./styleTypes.ts";
import { warm } from "./warm.ts";

export const styleIds = [
  "minimal",
  "warm",
  "bright",
  "night",
  "cinematic",
] as const;

export type StyleId = (typeof styleIds)[number];

export interface StyleEntry {
  id: StyleId;
  label: string;
  line: string;
  approved: boolean;
  words: readonly string[];
  definition: StyleDefinition;
}

export const styleEntries: readonly StyleEntry[] = [
  {
    id: "minimal",
    label: "Minimal",
    line: "A steady beat, a soft pad, and light plucks. It stays under the voice.",
    approved: false,
    words: ["minimal", "simple", "clean", "steady", "plain", "tech", "product"],
    definition: minimal,
  },
  {
    id: "warm",
    label: "Warm",
    line: "Electric piano chords, a round bass, and a relaxed beat with a little swing.",
    approved: false,
    words: [
      "warm",
      "friendly",
      "cozy",
      "lofi",
      "relaxed",
      "chill",
      "piano",
      "soft",
    ],
    definition: warm,
  },
  {
    id: "bright",
    label: "Bright",
    line: "Upbeat plucks, claps, and a four on the floor beat for a launch or a demo.",
    approved: false,
    words: [
      "bright",
      "upbeat",
      "happy",
      "energetic",
      "launch",
      "pop",
      "fun",
      "dance",
    ],
    definition: bright,
  },
  {
    id: "night",
    label: "Night",
    line: "A deep bass, wide pads, and a slow half time beat with a calm, late feel.",
    approved: false,
    words: [
      "night",
      "dark",
      "deep",
      "moody",
      "late",
      "smooth",
      "calm",
      "mysterious",
    ],
    definition: night,
  },
  {
    id: "cinematic",
    label: "Cinematic",
    line: "Low strings, deep hits, and a rising build to a strong end.",
    approved: false,
    words: [
      "cinematic",
      "epic",
      "film",
      "trailer",
      "dramatic",
      "big",
      "orchestral",
      "strings",
    ],
    definition: cinematic,
  },
];

export function offeredStylesOf(options: {
  entries: readonly StyleEntry[];
  withWaitingStyles: boolean;
}): StyleEntry[] {
  return options.entries.filter(
    (entry) => entry.approved || options.withWaitingStyles,
  );
}

export function styleFromPrompt(options: {
  prompt: string;
  offered: readonly StyleEntry[];
}): StyleEntry | undefined {
  const words = options.prompt.toLowerCase().match(/[a-z]+/g) ?? [];
  let best = options.offered[0];
  let bestCount = 0;
  for (const entry of options.offered) {
    const count = words.filter((word) => entry.words.includes(word)).length;
    if (count > bestCount) {
      best = entry;
      bestCount = count;
    }
  }
  return best;
}
