import { z } from "zod";
import { checkFileStem, type Outcome } from "../toolResults.ts";
import { nearestAspectRatio } from "./aspectRatio.ts";
import { videoModel } from "./videoModel.ts";

const pathInput = z.string().min(1);
const sidePixels = z.number().int().positive();

export const videoInput = {
  prompt: z.string().min(1).describe("What the clip shows and how it sounds"),
  duration_seconds: z
    .number()
    .describe(
      `Length of the clip in whole seconds, from ${String(videoModel.shortestSeconds)} to ${String(videoModel.longestSeconds)}`,
    ),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  model: z.string().optional().describe(`${videoModel.id}, the only model`),
  resolution: z
    .string()
    .optional()
    .describe(`${videoModel.resolution}, the only size of the model`),
  with_audio: z
    .boolean()
    .optional()
    .describe("Make sound with the picture. True by default"),
  first_frame_path: pathInput
    .optional()
    .describe("PNG, JPEG, or WebP picture that the clip starts on"),
  last_frame_path: pathInput
    .optional()
    .describe(
      "PNG, JPEG, or WebP picture that the clip ends on. Needs first_frame_path",
    ),
  reference_image_paths: z
    .array(pathInput)
    .optional()
    .describe(
      `Up to ${String(videoModel.maximumReferencePictures)} pictures of a person, a place, or a product to keep in the clip, with no first or last frame`,
    ),
  width_pixels: sidePixels
    .optional()
    .describe("Wanted width. The server picks the nearest supported shape"),
  height_pixels: sidePixels
    .optional()
    .describe("Wanted height. The server picks the nearest supported shape"),
};

export type VideoInput = z.infer<z.ZodObject<typeof videoInput>>;

export interface VideoPlan {
  prompt: string;
  durationSeconds: number;
  aspectRatio: string;
  withAudio: boolean;
  outputDirectory: string;
  fileStem: string;
  firstFramePath: string | undefined;
  lastFramePath: string | undefined;
  referenceImagePaths: string[];
}

function lengthFailure(input: VideoInput): string | undefined {
  const seconds = input.duration_seconds;
  const { shortestSeconds, longestSeconds } = videoModel;
  if (
    Number.isInteger(seconds) &&
    seconds >= shortestSeconds &&
    seconds <= longestSeconds
  ) {
    return undefined;
  }
  return `duration_seconds must be a whole number from ${String(shortestSeconds)} to ${String(longestSeconds)} for ${videoModel.label}. It was ${String(seconds)}.`;
}

function modelFailure(input: VideoInput): string | undefined {
  if (input.model !== undefined && input.model !== videoModel.id) {
    return `model must be ${videoModel.id}. It was ${input.model}.`;
  }
  if (
    input.resolution !== undefined &&
    input.resolution !== videoModel.resolution
  ) {
    return `resolution must be ${videoModel.resolution}, the only size of ${videoModel.label}. It was ${input.resolution}.`;
  }
  const characters = Array.from(input.prompt).length;
  if (characters > videoModel.maximumPromptCharacters) {
    return `prompt has ${String(characters)} characters. Sand AI takes at most 15,000.`;
  }
  return undefined;
}

function pictureFailure(input: VideoInput): string | undefined {
  const references = input.reference_image_paths ?? [];
  const hasFrames =
    input.first_frame_path !== undefined || input.last_frame_path !== undefined;
  if (references.length > videoModel.maximumReferencePictures) {
    return `reference_image_paths takes at most ${String(videoModel.maximumReferencePictures)} pictures. It had ${String(references.length)}.`;
  }
  if (references.length > 0 && hasFrames) {
    return "reference_image_paths cannot go with first_frame_path or last_frame_path. Sand AI takes reference pictures or frames in one clip, not both.";
  }
  if (
    input.last_frame_path !== undefined &&
    input.first_frame_path === undefined
  ) {
    return "last_frame_path needs first_frame_path.";
  }
  if (
    (input.width_pixels === undefined) !==
    (input.height_pixels === undefined)
  ) {
    return "Give both width_pixels and height_pixels, or neither.";
  }
  return undefined;
}

export function checkVideoInput(input: VideoInput): Outcome<VideoPlan, string> {
  const fileStem = checkFileStem(input.file_stem);
  if (!fileStem.ok) return fileStem;
  const failure =
    modelFailure(input) ?? lengthFailure(input) ?? pictureFailure(input);
  if (failure !== undefined) return { ok: false, failure };
  return {
    ok: true,
    value: {
      prompt: input.prompt,
      durationSeconds: input.duration_seconds,
      aspectRatio: nearestAspectRatio({
        widthPixels: input.width_pixels ?? 16,
        heightPixels: input.height_pixels ?? 9,
      }),
      withAudio: input.with_audio ?? true,
      outputDirectory: input.output_directory,
      fileStem: fileStem.value,
      firstFramePath: input.first_frame_path,
      lastFramePath: input.last_frame_path,
      referenceImagePaths: input.reference_image_paths ?? [],
    },
  };
}
