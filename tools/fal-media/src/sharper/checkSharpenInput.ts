import {
  sharperModelFor,
  sharperModels,
  type SharpenScale,
  type SharperModel,
} from "../catalog/sharper/index.ts";
import { readMediaFile, type MediaFile } from "../upload/mediaFile.ts";
import { checkFileStem, type Outcome } from "../toolResults.ts";

export interface CheckedSharpenInput {
  model: SharperModel;
  media: MediaFile;
  scale: SharpenScale;
  outputDirectory: string;
  fileStem: string;
}

const kindWords = { image: "pictures", video: "video" } as const;

export async function checkSharpenInput(input: {
  media_path: string;
  scale: SharpenScale;
  output_directory: string;
  file_stem: string;
  model?: string | undefined;
}): Promise<Outcome<CheckedSharpenInput, string>> {
  const stem = checkFileStem(input.file_stem);
  if (!stem.ok) return stem;
  const media = await readMediaFile(input.media_path);
  if (!media.ok) return media;
  const model = sharperModelFor({ id: input.model, kind: media.value.kind });
  if (model === undefined) {
    return {
      ok: false,
      failure: `Unknown model "${String(input.model)}". The sharper models of this server are: ${sharperModels.map((each) => each.id).join(", ")}.`,
    };
  }
  if (model.takes !== media.value.kind) {
    return {
      ok: false,
      failure: `${model.label} sharpens only ${kindWords[model.takes]}. Pick a model for ${kindWords[media.value.kind]}.`,
    };
  }
  return {
    ok: true,
    value: {
      model,
      media: media.value,
      scale: input.scale,
      outputDirectory: input.output_directory,
      fileStem: stem.value,
    },
  };
}
