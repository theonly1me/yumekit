import { availableParallelism } from "node:os";
import { join } from "node:path";
import { errorMessage, type Outcome } from "../toolResults.ts";

export interface SpokenAudio {
  samples: Float32Array;
  sampleRate: number;
}

export interface NaturalSpeaker {
  speak: (options: {
    text: string;
    speakerId: number;
    speed: number;
  }) => Promise<SpokenAudio>;
}

export type LoadSpeaker = (
  folder: string,
) => Promise<Outcome<NaturalSpeaker, string>>;

const largestThreadCount = 4;

export const loadKokoroSpeaker: LoadSpeaker = async (folder) => {
  try {
    const { default: sherpa } = await import("sherpa-onnx-node");
    const speaker = await sherpa.OfflineTts.createAsync({
      model: {
        kokoro: {
          model: join(folder, "model.int8.onnx"),
          voices: join(folder, "voices.bin"),
          tokens: join(folder, "tokens.txt"),
          lexicon: join(folder, "lexicon-us-en.txt"),
        },
        numThreads: Math.min(largestThreadCount, availableParallelism()),
        provider: "cpu",
        debug: false,
      },
      maxNumSentences: 1,
    });
    return {
      ok: true,
      value: {
        speak: (options) =>
          speaker.generateAsync({
            text: options.text,
            generationConfig: new sherpa.GenerationConfig({
              sid: options.speakerId,
              speed: options.speed,
            }),
          }),
      },
    };
  } catch (error) {
    return {
      ok: false,
      failure: `The natural voice cannot start on this computer: ${errorMessage(error)}`,
    };
  }
};
