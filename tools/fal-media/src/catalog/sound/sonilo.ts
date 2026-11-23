import { falPage } from "../shapes.ts";
import type { SoundModel } from "./types.ts";

const endpointId = "sonilo/v1.1/text-to-sound-effects";
const durationWithNoRequest = 5;

export const sonilo11: SoundModel = {
  id: endpointId,
  label: "Sonilo 1.1 Sound Effects",
  isDefault: false,
  readOn: "2026-11-23",
  tested: false,
  sources: [falPage(endpointId)],
  prices: [{ usd: 0.0018, unit: "second", when: {} }],
  durationSeconds: { minimum: 1, maximum: 180, default: durationWithNoRequest },
  call: (request) => ({
    endpointId,
    fields: {
      prompt: request.prompt,
      duration: request.durationSeconds ?? durationWithNoRequest,
      audio_format: "mp3",
    },
  }),
};
