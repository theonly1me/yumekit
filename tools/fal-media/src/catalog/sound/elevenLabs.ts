import { falPage } from "../shapes.ts";
import type { SoundModel } from "./types.ts";

const endpointId = "elevenlabs/sound-effects/v3";

export const elevenLabsSoundEffects3: SoundModel = {
  id: endpointId,
  label: "ElevenLabs Sound Effects 3",
  isDefault: true,
  readOn: "2026-11-23",
  tested: false,
  sources: [falPage(endpointId)],
  prices: [{ usd: 0.002, unit: "second", when: {} }],
  durationSeconds: { minimum: 1, maximum: 30, default: 5 },
  call: (request) => ({
    endpointId,
    fields: {
      text: request.prompt,
      output_format: "mp3_44100_128",
      ...(request.durationSeconds === undefined
        ? {}
        : { duration_seconds: request.durationSeconds }),
    },
  }),
};
