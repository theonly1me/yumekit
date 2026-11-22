import {
  findImageModel,
  imageModels,
  type ImageChoiceName,
  type ImageModel,
} from "../catalog/image/index.ts";
import { squareShape } from "../catalog/shapes.ts";
import { checkFileStem, type Outcome } from "../toolResults.ts";

export interface ImageInput {
  prompt: string;
  output_directory: string;
  file_stem: string;
  model?: string | undefined;
  width_pixels?: number | undefined;
  height_pixels?: number | undefined;
  reference_image_paths?: string[] | undefined;
  transparent_background?: boolean | undefined;
  resolution?: string | undefined;
  quality?: string | undefined;
}

export interface CheckedImageInput {
  model: ImageModel;
  prompt: string;
  widthPixels: number;
  heightPixels: number;
  choices: Partial<Record<ImageChoiceName, string>>;
  transparentBackground: boolean;
  referenceImagePaths: string[];
  outputDirectory: string;
  fileStem: string;
}

function checkModel(id: string | undefined): Outcome<ImageModel, string> {
  const model = findImageModel(id);
  if (model) return { ok: true, value: model };
  const ids = imageModels.map((entry) => entry.id).join(", ");
  return {
    ok: false,
    failure: `model "${String(id)}" is not a picture model of this server. Use one of: ${ids}.`,
  };
}

function checkChoices(options: {
  model: ImageModel;
  input: ImageInput;
}): Outcome<Partial<Record<ImageChoiceName, string>>, string> {
  const { model, input } = options;
  const choices: Partial<Record<ImageChoiceName, string>> = {};
  const choiceNames: readonly ImageChoiceName[] = ["resolution", "quality"];
  for (const name of choiceNames) {
    const value = input[name];
    const setting = model.choiceSettings.find((entry) => entry.name === name);
    if (setting === undefined) {
      if (value === undefined) continue;
      return { ok: false, failure: `${model.label} has no ${name} setting.` };
    }
    if (value !== undefined && !setting.choices.includes(value)) {
      return {
        ok: false,
        failure: `${name} must be one of ${setting.choices.join(", ")} for ${model.label}.`,
      };
    }
    choices[name] = value ?? setting.default;
  }
  return { ok: true, value: choices };
}

function otherFailure(options: {
  model: ImageModel;
  input: ImageInput;
}): string | undefined {
  const { model, input } = options;
  const referenceCount = (input.reference_image_paths ?? []).length;
  if (referenceCount > 0 && model.references === undefined) {
    return `${model.label} does not accept reference_image_paths.`;
  }
  if (
    model.references !== undefined &&
    referenceCount > model.references.maximum
  ) {
    return `${model.label} accepts at most ${String(model.references.maximum)} reference_image_paths.`;
  }
  if (input.transparent_background === true && !model.transparentBackground) {
    return `${model.label} cannot make a transparent background.`;
  }
  if (
    (input.width_pixels === undefined) !==
    (input.height_pixels === undefined)
  ) {
    return "Give both width_pixels and height_pixels, or neither.";
  }
  return undefined;
}

export function checkImageInput(
  input: ImageInput,
): Outcome<CheckedImageInput, string> {
  const model = checkModel(input.model);
  if (!model.ok) return model;
  const fileStem = checkFileStem(input.file_stem);
  if (!fileStem.ok) return fileStem;
  const failure = otherFailure({ model: model.value, input });
  if (failure !== undefined) return { ok: false, failure };
  const choices = checkChoices({ model: model.value, input });
  if (!choices.ok) return choices;
  return {
    ok: true,
    value: {
      model: model.value,
      prompt: input.prompt,
      widthPixels: input.width_pixels ?? squareShape.widthPixels,
      heightPixels: input.height_pixels ?? squareShape.heightPixels,
      choices: choices.value,
      transparentBackground: input.transparent_background ?? false,
      referenceImagePaths: input.reference_image_paths ?? [],
      outputDirectory: input.output_directory,
      fileStem: fileStem.value,
    },
  };
}
