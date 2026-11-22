import type { CatalogEntry } from "./catalogModel.ts";

const speechGuide =
  "https://developers.openai.com/api/docs/guides/text-to-speech";

const speechShutdown = "2027-01-06";

export const openAiVoices = [
  "marin",
  "cedar",
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
];

export const classicVoices = [
  "alloy",
  "ash",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
];

export const modelsWithoutInstructions = ["tts-1", "tts-1-hd"];

function classicModel(options: {
  id: string;
  label: string;
  usdPerThousandCharacters: number;
}): CatalogEntry {
  return {
    sourceUrl: speechGuide,
    model: {
      id: options.id,
      label: options.label,
      capability: "speech",
      settings: [
        {
          name: "voice",
          label: "Voice",
          kind: "choice",
          choices: classicVoices,
          default: "alloy",
        },
      ],
      prices: [
        {
          usd: options.usdPerThousandCharacters,
          unit: "thousand-characters",
          when: {},
        },
      ],
      shutdown_on: speechShutdown,
      tested: false,
    },
  };
}

export const speechEntries: CatalogEntry[] = [
  {
    sourceUrl: speechGuide,
    model: {
      id: "gpt-4o-mini-tts",
      label: "GPT-4o mini TTS",
      capability: "speech",
      settings: [
        {
          name: "voice",
          label: "Voice",
          kind: "choice",
          choices: openAiVoices,
          default: "marin",
        },
      ],
      prices: [],
      shutdown_on: speechShutdown,
    },
  },
  classicModel({
    id: "tts-1",
    label: "TTS 1",
    usdPerThousandCharacters: 0.015,
  }),
  classicModel({
    id: "tts-1-hd",
    label: "TTS 1 HD",
    usdPerThousandCharacters: 0.03,
  }),
];
