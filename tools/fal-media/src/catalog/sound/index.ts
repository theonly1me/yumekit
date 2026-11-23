import { elevenLabsSoundEffects3 } from "./elevenLabs.ts";
import { mireloSfx2 } from "./mirelo.ts";
import { sonilo11 } from "./sonilo.ts";
import { stableAudio3Sfx } from "./stableAudio.ts";
import type { SoundModel } from "./types.ts";

export type { SoundModel, SoundRequest } from "./types.ts";

export const soundModels: readonly SoundModel[] = [
  elevenLabsSoundEffects3,
  mireloSfx2,
  sonilo11,
  stableAudio3Sfx,
];

export function findSoundModel(id: string | undefined): SoundModel | undefined {
  if (id === undefined) return soundModels.find((model) => model.isDefault);
  return soundModels.find((model) => model.id === id);
}
