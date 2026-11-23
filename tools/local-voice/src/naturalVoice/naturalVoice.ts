import { join } from "node:path";
import { errorMessage, type Outcome } from "../toolResults.ts";
import {
  downloadModel,
  isModelDownloaded,
  type FetchFile,
} from "./download.ts";
import { lexiconOf, unknownWordsOf } from "./knownWords.ts";
import type { NaturalModel } from "./modelFiles.ts";
import type { LoadSpeaker, SpokenAudio } from "./naturalSpeaker.ts";
import { pronunciationLinesOf, type Pronunciations } from "./pronunciations.ts";
import { withSpokenNumbers } from "./spokenNumbers.ts";
import { createSpeakerCache } from "./speakerCache.ts";
import type { VoiceEntry } from "./voices.ts";

export type OnDownloadProgress = (progress: {
  done: number;
  total: number;
}) => Promise<void>;

export interface NaturalVoice {
  isDownloaded: () => Promise<boolean>;
  download: (onProgress: OnDownloadProgress) => Promise<Outcome<true, string>>;
  speak: (options: {
    text: string;
    voice: string;
    speed: number;
    pronunciations: Pronunciations;
    onDownloadProgress: OnDownloadProgress;
  }) => Promise<Outcome<SpokenAudio, string>>;
}

function unknownWordsMessage(words: string[]): string {
  const [first = "Hoshi"] = words;
  return `The natural voice does not know these words: ${words.join(", ")}. Give each one in the input pronunciations as it sounds, in common English words, for example {"${first}": "hoe she"}. The text keeps the word.`;
}

export function createNaturalVoice(options: {
  folder: string;
  model: NaturalModel;
  voices: VoiceEntry[];
  fetchFile: FetchFile;
  loadSpeaker: LoadSpeaker;
}): NaturalVoice {
  const { folder, model, voices } = options;
  let download: Promise<Outcome<true, string>> | undefined;
  const speakers = createSpeakerCache({
    folder,
    loadSpeaker: options.loadSpeaker,
  });

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

  return {
    isDownloaded: () => isModelDownloaded({ folder, model }),
    download: downloaded,
    speak: async (request) => {
      const voice = voices.find(
        (entry) => entry.approved && entry.name === request.voice,
      );
      if (voice === undefined) {
        const names = voices.filter((entry) => entry.approved);
        return {
          ok: false,
          failure: `voice must be one of: ${names.map((entry) => entry.name).join(", ")}. It was ${request.voice}.`,
        };
      }
      const ready = await downloaded(request.onDownloadProgress);
      if (!ready.ok) return ready;
      const text = withSpokenNumbers(request.text);
      try {
        const lexicon = await lexiconOf(join(folder, "lexicon-us-en.txt"));
        const lines = pronunciationLinesOf({
          pronunciations: request.pronunciations,
          lexicon,
        });
        if (!lines.ok) return lines;
        const added = new Set(lines.value.map((line) => line.split(" ", 1)[0]));
        const unknown = unknownWordsOf({
          text,
          isKnown: (word) => lexicon.has(word) || added.has(word),
        });
        if (unknown.length > 0)
          return { ok: false, failure: unknownWordsMessage(unknown) };
        const started = await speakers.speakerFor(lines.value);
        if (!started.ok) return started;
        const audio = await started.value.speak({
          text,
          speakerId: voice.speakerId,
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
