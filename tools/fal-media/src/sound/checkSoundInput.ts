import {
  findSoundModel,
  soundModels,
  type SoundModel,
} from "../catalog/sound/index.ts";
import { checkFileStem, type Outcome } from "../toolResults.ts";

export interface CheckedSoundInput {
  model: SoundModel;
  prompt: string;
  durationSeconds: number | undefined;
  outputDirectory: string;
  fileStem: string;
}

export function checkSoundInput(input: {
  prompt: string;
  duration_seconds?: number | undefined;
  output_directory: string;
  file_stem: string;
  model?: string | undefined;
}): Outcome<CheckedSoundInput, string> {
  const model = findSoundModel(input.model);
  if (model === undefined) {
    return {
      ok: false,
      failure: `Unknown model "${String(input.model)}". The sound effect models of this server are: ${soundModels.map((each) => each.id).join(", ")}.`,
    };
  }
  const stem = checkFileStem(input.file_stem);
  if (!stem.ok) return stem;
  const { minimum, maximum } = model.durationSeconds;
  const seconds = input.duration_seconds;
  if (seconds !== undefined && (seconds < minimum || seconds > maximum)) {
    return {
      ok: false,
      failure: `duration_seconds ${String(seconds)} does not fit ${model.label}. It takes ${String(minimum)} to ${String(maximum)} seconds.`,
    };
  }
  return {
    ok: true,
    value: {
      model,
      prompt: input.prompt,
      durationSeconds: seconds,
      outputDirectory: input.output_directory,
      fileStem: stem.value,
    },
  };
}
