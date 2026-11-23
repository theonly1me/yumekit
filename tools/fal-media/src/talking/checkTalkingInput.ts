import {
  talkingModelFor,
  talkingModels,
  type TalkingModel,
} from "../catalog/talking/index.ts";
import { checkFileStem, type Outcome } from "../toolResults.ts";
import { readAudioFile, type AudioFile } from "../upload/audioFile.ts";
import { readMediaFile, type MediaFile } from "../upload/mediaFile.ts";

export interface CheckedTalkingInput {
  model: TalkingModel;
  media: MediaFile;
  voice: AudioFile;
  prompt: string | undefined;
  resolution: string;
  outputDirectory: string;
  fileStem: string;
}

const kindWords = { image: "a picture", video: "a video" } as const;

function resolutionOf(options: {
  model: TalkingModel;
  resolution: string | undefined;
}): Outcome<string, string> {
  const { model, resolution } = options;
  const choices = model.resolutions?.choices ?? [];
  if (resolution === undefined) {
    return { ok: true, value: model.resolutions?.default ?? "" };
  }
  if (choices.includes(resolution)) return { ok: true, value: resolution };
  return {
    ok: false,
    failure:
      choices.length === 0
        ? `${model.label} has no resolution setting.`
        : `resolution ${resolution} does not fit ${model.label}. It takes ${choices.join(", ")}.`,
  };
}

export async function checkTalkingInput(input: {
  media_path: string;
  audio_path: string;
  prompt?: string | undefined;
  resolution?: string | undefined;
  output_directory: string;
  file_stem: string;
  model?: string | undefined;
}): Promise<Outcome<CheckedTalkingInput, string>> {
  const stem = checkFileStem(input.file_stem);
  if (!stem.ok) return stem;
  const media = await readMediaFile(input.media_path);
  if (!media.ok) return media;
  const model = talkingModelFor({ id: input.model, kind: media.value.kind });
  if (model === undefined) {
    return {
      ok: false,
      failure: `Unknown model "${String(input.model)}". The talking clip models of this server are: ${talkingModels.map((each) => each.id).join(", ")}.`,
    };
  }
  if (model.takes !== media.value.kind) {
    return {
      ok: false,
      failure: `${model.label} takes only ${kindWords[model.takes]} of the person. Pick a model for ${kindWords[media.value.kind]}.`,
    };
  }
  const resolution = resolutionOf({ model, resolution: input.resolution });
  if (!resolution.ok) return resolution;
  const voice = await readAudioFile(input.audio_path);
  if (!voice.ok) return voice;
  const minimum = model.minimumVoiceSeconds;
  const seconds = voice.value.seconds;
  if (minimum !== undefined && seconds !== undefined && seconds < minimum) {
    return {
      ok: false,
      failure: `${model.label} needs a voice of at least ${String(minimum)} seconds. This voice is ${seconds.toFixed(1)} seconds.`,
    };
  }
  return {
    ok: true,
    value: {
      model,
      media: media.value,
      voice: voice.value,
      prompt: input.prompt,
      resolution: resolution.value,
      outputDirectory: input.output_directory,
      fileStem: stem.value,
    },
  };
}
