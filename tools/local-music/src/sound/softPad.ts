import type { SoftPadSound } from "../styles/styleTypes.ts";
import { additiveVoice } from "./tones.ts";
import type { Voice } from "./voice.ts";

const sides = [-1, 1] as const;

export function softPadVoice(sound: SoftPadSound): Voice {
  const voice = additiveVoice(sound);
  return (request) => {
    for (const side of sides) {
      voice({
        ...request,
        pan: request.pan + side * 0.55,
        note: {
          ...request.note,
          pitch: request.note.pitch + (side * sound.detuneCents) / 100,
          velocity: request.note.velocity * 0.5,
        },
      });
    }
  };
}
