import type { CatalogEntry } from "../describe/mediaServerDescription.ts";

export interface SpeechModelFacts {
  id: string;
  label: string;
  isDefault: boolean;
  usdPerSecond: number;
}

export const geminiVoices = [
  "Zephyr",
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
  "Leda",
  "Orus",
  "Aoede",
  "Callirrhoe",
  "Autonoe",
  "Enceladus",
  "Iapetus",
  "Umbriel",
  "Algieba",
  "Despina",
  "Erinome",
  "Algenib",
  "Rasalgethi",
  "Laomedeia",
  "Achernar",
  "Alnilam",
  "Schedar",
  "Gacrux",
  "Pulcherrima",
  "Achird",
  "Zubenelgenubi",
  "Vindemiatrix",
  "Sadachbia",
  "Sadaltager",
  "Sulafat",
];

export const defaultVoice = "Kore";

export const speechModels: SpeechModelFacts[] = [
  {
    id: "gemini-3.8-flash-tts",
    label: "Gemini 3.8 Flash TTS",
    isDefault: true,
    usdPerSecond: 0.000225,
  },
  {
    id: "gemini-3.8-flash-lite-tts",
    label: "Gemini 3.8 Flash-Lite TTS",
    isDefault: false,
    usdPerSecond: 0.00015,
  },
];

export const speechCatalog: CatalogEntry[] = speechModels.map((facts) => ({
  sourceUrl: "https://aistudio.google.com/docs/speech-generation",
  model: {
    id: facts.id,
    label: facts.label,
    capability: "speech",
    is_default: facts.isDefault,
    settings: [
      {
        name: "voice",
        label: "Voice",
        kind: "choice",
        choices: geminiVoices,
        default: defaultVoice,
      },
    ],
    prices: [{ usd: facts.usdPerSecond, unit: "second", when: {} }],
    read_on: "2026-11-22",
    tested: false,
  },
}));
