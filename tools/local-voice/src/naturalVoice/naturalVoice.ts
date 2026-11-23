import { join } from "node:path";
import { errorMessage, type Outcome } from "../toolResults.ts";
import {
  downloadModel,
  isModelDownloaded,
  type FetchFile,
} from "./download.ts";
import { knownWordsOf, unknownWordsOf } from "./knownWords.ts";
import type { NaturalModel } from "./modelFiles.ts";
import type {
  LoadSpeaker,
  NaturalSpeaker,
  SpokenAudio,
} from "./naturalSpeaker.ts";
import { withSpokenNumbers } from "./spokenNumbers.ts";

export const naturalVoiceIds = {
  Heart: 3,
  Bella: 2,
  Nicole: 6,
  Sarah: 9,
  Kore: 5,
  Aoede: 1,
  Michael: 16,
  Fenrir: 14,
  Puck: 18,
} as const;

export const naturalVoiceNames = Object.keys(naturalVoiceIds);
export const defaultNaturalVoice = "Heart";

export type OnDownloadProgress = (progress: {
  done: number;
  total: number;
}) => Promise<void>;

export interface NaturalVoice {
  isDownloaded: () => Promise<boolean>;
  speak: (options: {
    text: string;
    voice: string;
    speed: number;
    onDownloadProgress: OnDownloadProgress;
  }) => Promise<Outcome<SpokenAudio, string>>;
}

function speakerIdOf(voice: string): number | undefined {
  for (const [name, id] of Object.entries(naturalVoiceIds)) {
    if (name === voice) return id;
  }
  return undefined;
}

function unknownWordsMessage(words: string[]): string {
  return `The natural voice does not know these words: ${words.join(", ")}. Write each one as it sounds, in common English words (for example "you may kit" for yumekit), or use the voice of this computer.`;
}

export function createNaturalVoice(options: {
  folder: string;
  model: NaturalModel;
  fetchFile: FetchFile;
  loadSpeaker: LoadSpeaker;
}): NaturalVoice {
  const { folder, model } = options;
  let download: Promise<Outcome<true, string>> | undefined;
  let speaker: Promise<Outcome<NaturalSpeaker, string>> | undefined;

  const downloaded = async (onProgress: OnDownloadProgress) => {
    if (await isModelDownloaded({ folder, model })) {
      return { ok: true, value: true } as const;
    }
    download ??= downloadModel({
      folder,
      model,
      fetchFile: options.fetchFile,
      onProgress,
    });
    const result = await download;
    download = undefined;
    return result;
  };

  const loaded = async () => {
    speaker ??= options.loadSpeaker(folder);
    const result = await speaker;
    if (!result.ok) speaker = undefined;
    return result;
  };

  return {
    isDownloaded: () => isModelDownloaded({ folder, model }),
    speak: async (request) => {
      const speakerId = speakerIdOf(request.voice);
      if (speakerId === undefined) {
        return {
          ok: false,
          failure: `voice must be one of: ${naturalVoiceNames.join(", ")}. It was ${request.voice}.`,
        };
      }
      const ready = await downloaded(request.onDownloadProgress);
      if (!ready.ok) return ready;
      const text = withSpokenNumbers(request.text);
      try {
        const knownWords = await knownWordsOf(
          join(folder, "lexicon-us-en.txt"),
        );
        const unknown = unknownWordsOf({ text, knownWords });
        if (unknown.length > 0)
          return { ok: false, failure: unknownWordsMessage(unknown) };
        const started = await loaded();
        if (!started.ok) return started;
        const audio = await started.value.speak({
          text,
          speakerId,
          speed: request.speed,
        });
        if (audio.samples.length === 0) {
          return {
            ok: false,
            failure: "The natural voice made no sound for this text.",
          };
        }
        return { ok: true, value: audio };
      } catch (error) {
        return {
          ok: false,
          failure: `The natural voice failed: ${errorMessage(error)}`,
        };
      }
    },
  };
}
