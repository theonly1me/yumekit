import type { CatalogEntry } from "../describe/mediaServerDescription.ts";

export interface MusicModelFacts {
  id: string;
  label: string;
  isDefault: boolean;
  shortestSeconds: number;
  longestSeconds: number;
  lengthIsInPrompt: boolean;
  usdPerSong: number;
}

export const maximumMusicImages = 10;

export const defaultMusicSeconds = 30;

export const instrumentalSentence = "Instrumental only, no vocals.";

export const musicModels: MusicModelFacts[] = [
  {
    id: "lyria-3.5",
    label: "Lyria 3.5",
    isDefault: true,
    shortestSeconds: 10,
    longestSeconds: 180,
    lengthIsInPrompt: true,
    usdPerSong: 0.08,
  },
  {
    id: "lyria-3-clip-preview",
    label: "Lyria 3 Clip (30 seconds)",
    isDefault: false,
    shortestSeconds: 30,
    longestSeconds: 30,
    lengthIsInPrompt: false,
    usdPerSong: 0.04,
  },
];

export const musicCatalog: CatalogEntry[] = musicModels.map((facts) => ({
  sourceUrl: "https://aistudio.google.com/docs/music-generation",
  model: {
    id: facts.id,
    label: facts.label,
    capability: "music",
    is_default: facts.isDefault,
    settings: [
      {
        name: "duration_seconds",
        label: "Length in seconds",
        kind: "whole-number",
        minimum: facts.shortestSeconds,
        maximum: facts.longestSeconds,
        default: defaultMusicSeconds,
      },
      {
        name: "instrumental",
        label: "No singing",
        kind: "switch",
        default: true,
      },
      {
        name: "reference_image_paths",
        label: "Pictures for the mood",
        kind: "image-files",
        maximum: maximumMusicImages,
      },
    ],
    prices: [{ usd: facts.usdPerSong, unit: "call", when: {} }],
    read_on: "2026-11-24",
    accepts: ["reference_images"],
    tested: false,
  },
}));
