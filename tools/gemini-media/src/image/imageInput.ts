import { z } from "zod";
import { chooseModel } from "../chooseModel.ts";
import { checkFileStem, type Outcome } from "../toolResults.ts";
import {
  defaultImageSize,
  imageModels,
  type ImageModelFacts,
} from "./imageModels.ts";

const pathInput = z.string().min(1);

const sidePixels = z.number().int().positive();

export const imageInput = {
  prompt: z.string().min(1).describe("What the picture shows"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  width_pixels: sidePixels
    .optional()
    .describe("Wanted width. Selects the nearest shape of the model"),
  height_pixels: sidePixels
    .optional()
    .describe("Wanted height. Selects the nearest shape of the model"),
  reference_image_paths: z
    .array(pathInput)
    .optional()
    .describe("PNG, JPEG, or WebP images of people or objects to keep"),
  transparent_background: z
    .boolean()
    .optional()
    .describe("Gemini makes no transparent background, so only false works"),
  resolution: z
    .string()
    .optional()
    .describe(
      `1K, 2K, or 4K when the model has them. ${defaultImageSize} by default`,
    ),
  model: z
    .string()
    .optional()
    .describe("The id of a model from describe_media_server"),
};

export type ImageInput = z.infer<z.ZodObject<typeof imageInput>>;

export interface ImagePlan {
  model: ImageModelFacts;
  prompt: string;
  fileStem: string;
  aspectRatio: string | undefined;
  imageSize: string | undefined;
  referenceImagePaths: string[];
}

function ratioValue(ratio: string): number {
  const [width, height] = ratio.split(":").map(Number);
  if (width === undefined || height === undefined) return 1;
  return width / height;
}

function nearestRatio(options: {
  ratios: string[];
  width: number;
  height: number;
}): string | undefined {
  const wanted = Math.log(options.width / options.height);
  const distance = (ratio: string) =>
    Math.abs(Math.log(ratioValue(ratio)) - wanted);
  let nearest: string | undefined;
  for (const ratio of options.ratios) {
    if (nearest === undefined || distance(ratio) < distance(nearest)) {
      nearest = ratio;
    }
  }
  return nearest;
}

function aspectRatioOf(options: {
  input: ImageInput;
  model: ImageModelFacts;
}): Outcome<string | undefined, string> {
  const { width_pixels: width, height_pixels: height } = options.input;
  if (width === undefined && height === undefined) {
    return { ok: true, value: undefined };
  }
  if (width === undefined || height === undefined) {
    return {
      ok: false,
      failure: "Give both width_pixels and height_pixels, or neither.",
    };
  }
  return {
    ok: true,
    value: nearestRatio({ ratios: options.model.aspectRatios, width, height }),
  };
}

function imageSizeOf(options: {
  input: ImageInput;
  model: ImageModelFacts;
}): Outcome<string | undefined, string> {
  const { model, input } = options;
  if (model.imageSizes.length === 0) {
    if (input.resolution === undefined) return { ok: true, value: undefined };
    return {
      ok: false,
      failure: `${model.id} has one resolution, so it takes no resolution.`,
    };
  }
  const size = input.resolution ?? defaultImageSize;
  if (model.imageSizes.includes(size)) return { ok: true, value: size };
  return {
    ok: false,
    failure: `resolution must be ${model.imageSizes.join(", ")} for ${model.id}. It was ${size}.`,
  };
}

function referencesOf(options: {
  input: ImageInput;
  model: ImageModelFacts;
}): Outcome<string[], string> {
  const references = options.input.reference_image_paths ?? [];
  const { maximumReferenceImages, id } = options.model;
  if (references.length <= maximumReferenceImages) {
    return { ok: true, value: references };
  }
  if (maximumReferenceImages === 0) {
    return { ok: false, failure: `${id} takes no reference images.` };
  }
  return {
    ok: false,
    failure: `reference_image_paths accepts up to ${String(maximumReferenceImages)} images for ${id}. It had ${String(references.length)}.`,
  };
}

export function checkImageInput(input: ImageInput): Outcome<ImagePlan, string> {
  const model = chooseModel({
    models: imageModels,
    requested: input.model,
    kind: "image",
  });
  if (!model.ok) return model;
  const fileStem = checkFileStem(input.file_stem);
  if (!fileStem.ok) return fileStem;
  if (input.transparent_background === true) {
    return {
      ok: false,
      failure:
        "The Gemini picture models make no transparent background. Use another server for it.",
    };
  }
  const facts = { input, model: model.value };
  const aspectRatio = aspectRatioOf(facts);
  if (!aspectRatio.ok) return aspectRatio;
  const imageSize = imageSizeOf(facts);
  if (!imageSize.ok) return imageSize;
  const references = referencesOf(facts);
  if (!references.ok) return references;
  return {
    ok: true,
    value: {
      model: model.value,
      prompt: input.prompt,
      fileStem: fileStem.value,
      aspectRatio: aspectRatio.value,
      imageSize: imageSize.value,
      referenceImagePaths: references.value,
    },
  };
}
