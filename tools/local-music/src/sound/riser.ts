import { noiseAt } from "../compose/random.ts";
import { sampleRate } from "../compose/timing.ts";
import { createFilter } from "../mix/filters.ts";
import { riseCurve, writeMono, type Voice } from "./voice.ts";

const lowHertz = 350;
const highHertz = 6500;

export const riserVoice: Voice = (request) => {
  const { note } = request;
  const count = Math.ceil(note.lengthSeconds * sampleRate);
  const firstSample = Math.round(note.startSeconds * sampleRate);
  const samples = new Float32Array(count);
  const filter = createFilter({
    kind: "bandpass",
    hertz: lowHertz,
    resonance: 1.6,
  });
  const endFade = 0.02 * sampleRate;
  for (let index = 0; index < count; index += 1) {
    const share = index / count;
    if (index % 32 === 0) {
      filter.setHertz(lowHertz * (highHertz / lowHertz) ** share);
    }
    const swell = share ** 2.2 * riseCurve((count - index) / endFade);
    samples[index] =
      filter.run(noiseAt(firstSample + index)) * swell * note.velocity * 2.2;
  }
  writeMono({ request, samples });
};
