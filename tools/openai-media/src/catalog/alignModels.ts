import type { CatalogEntry } from "./catalogModel.ts";

export const alignEntries: CatalogEntry[] = [
  {
    sourceUrl: "https://developers.openai.com/api/docs/guides/speech-to-text",
    model: {
      id: "whisper-1",
      label: "Whisper",
      capability: "align",
      settings: [],
      prices: [{ usd: 0.006, unit: "minute", when: {} }],
      shutdown_on: "2027-02-26",
    },
  },
];
