import { falPage } from "../shapes.ts";
import type { SoundModel } from "./types.ts";

const endpointId = "mirelo-ai/sfx2.0/text-to-audio";
const durationWithNoRequest = 5;

export const mireloSfx2: SoundModel = {
  id: endpointId,
  label: "Mirelo SFX 2.0",
  isDefault: false,
  readOn: "2026-11-23",
  tested: false,
  sources: [falPage(endpointId)],
  prices: [{ usd: 0.015, unit: "second", when: {} }],
  durationSeconds: { minimum: 1, maximum: 600, default: durationWithNoRequest },
  call: (request) => ({
    endpointId,
    fields: {
      prompt: request.prompt,
      duration: request.durationSeconds ?? durationWithNoRequest,
      num_samples: 1,
      upload_audio_format: "mp3",
    },
  }),
};
