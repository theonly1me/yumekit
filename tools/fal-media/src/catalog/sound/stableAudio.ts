import { falPage } from "../shapes.ts";
import type { SoundModel } from "./types.ts";

const endpointId = "fal-ai/stable-audio-3/small/sfx/text-to-audio";
const durationWithNoRequest = 5;

export const stableAudio3Sfx: SoundModel = {
  id: endpointId,
  label: "Stable Audio 3 Small SFX",
  isDefault: false,
  readOn: "2026-11-23",
  tested: false,
  sources: [falPage(endpointId)],
  prices: [],
  durationSeconds: { minimum: 1, maximum: 120, default: durationWithNoRequest },
  call: (request) => ({
    endpointId,
    fields: {
      prompt: request.prompt,
      duration: request.durationSeconds ?? durationWithNoRequest,
      output_format: "mp3",
    },
  }),
};
