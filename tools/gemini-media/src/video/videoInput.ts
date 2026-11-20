import { z } from "zod";
import { checkFileStem, type Outcome } from "../toolResults.ts";
import { isResolution, videoModel, type Resolution } from "./videoModel.ts";

const pathInput = z.string().min(1);

export const videoInput = {
  prompt: z.string().min(1).describe("What the clip shows and how it sounds"),
  duration_seconds: z
    .number()
    .describe(
      `Length of the clip in whole seconds, from ${String(videoModel.shortestSeconds)} to ${String(videoModel.longestSeconds)}`,
    ),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  first_frame_path: pathInput
    .optional()
    .describe("PNG, JPEG, or WebP image that the clip starts with"),
  last_frame_path: pathInput
    .optional()
    .describe(
      `PNG, JPEG, or WebP image that the clip ends with. Needs first_frame_path and at most ${String(videoModel.longestSecondsWithLastFrame)} seconds`,
    ),
  reference_image_paths: z
    .array(pathInput)
    .optional()
    .describe(
      `Up to ${String(videoModel.maximumReferenceImages)} PNG, JPEG, or WebP images of people or objects to keep the same`,
    ),
  width_pixels: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Wanted width. The clip is 16:9 when it is wider than tall"),
  height_pixels: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Wanted height. The clip is 9:16 when it is not wider than tall"),
  with_audio: z
    .boolean()
    .optional()
    .describe("The model always makes sound, so only true is accepted"),
  resolution: z
    .string()
    .optional()
    .describe(`${videoModel.resolutions.join(" or ")}. 720p by default`),
  model: z.string().optional().describe(`${videoModel.id} by default`),
};

export type VideoInput = z.infer<z.ZodObject<typeof videoInput>>;

export interface VideoPlan {
  model: string;
  prompt: string;
  durationSeconds: number;
  aspectRatio: "16:9" | "9:16";
  resolution: Resolution;
  fileStem: string;
  firstFramePath: string | undefined;
  lastFramePath: string | undefined;
  referenceImagePaths: string[];
}

function failure(message: string): Outcome<never, string> {
  return { ok: false, failure: message };
}

function checkFrames(input: VideoInput): string | undefined {
  if (input.last_frame_path === undefined) return undefined;
  if (input.first_frame_path === undefined) {
    return "last_frame_path needs first_frame_path.";
  }
  if (input.duration_seconds > videoModel.longestSecondsWithLastFrame) {
    return `last_frame_path works only with duration_seconds from ${String(videoModel.shortestSeconds)} to ${String(videoModel.longestSecondsWithLastFrame)}, because the model supports a first and a last frame only up to ${String(videoModel.longestSecondsWithLastFrame)} seconds.`;
  }
  return undefined;
}

function aspectRatioOf(input: VideoInput): Outcome<"16:9" | "9:16", string> {
  const { width_pixels: width, height_pixels: height } = input;
  if (width === undefined && height === undefined) {
    return { ok: true, value: "16:9" };
  }
  if (width === undefined || height === undefined) {
    return failure("Give both width_pixels and height_pixels, or neither.");
  }
  return { ok: true, value: width > height ? "16:9" : "9:16" };
}

function resolutionOf(input: VideoInput): Outcome<Resolution, string> {
  const resolution = input.resolution ?? videoModel.defaultResolution;
  if (isResolution(resolution)) return { ok: true, value: resolution };
  return failure(
    `resolution must be ${videoModel.resolutions.join(" or ")}. It was ${resolution}.`,
  );
}

function checkSettings(input: VideoInput): string | undefined {
  const seconds = input.duration_seconds;
  if (
    !Number.isInteger(seconds) ||
    seconds < videoModel.shortestSeconds ||
    seconds > videoModel.longestSeconds
  ) {
    return `duration_seconds must be a whole number from ${String(videoModel.shortestSeconds)} to ${String(videoModel.longestSeconds)}. It was ${String(seconds)}.`;
  }
  if (input.model !== undefined && input.model !== videoModel.id) {
    return `model must be one of: ${videoModel.id}. It was ${input.model}.`;
  }
  if (input.with_audio === false) {
    return `${videoModel.id} always makes sound, so with_audio cannot be false. To leave the sound out, place the clip with no sound clip.`;
  }
  const references = input.reference_image_paths ?? [];
  if (references.length > videoModel.maximumReferenceImages) {
    return `reference_image_paths accepts up to ${String(videoModel.maximumReferenceImages)} images. It had ${String(references.length)}.`;
  }
  return checkFrames(input);
}

export function checkVideoInput(options: {
  input: VideoInput;
  configuredModel: string;
}): Outcome<VideoPlan, string> {
  const { input } = options;
  const fileStem = checkFileStem(input.file_stem);
  if (!fileStem.ok) return fileStem;
  const settingFailure = checkSettings(input);
  if (settingFailure !== undefined) return failure(settingFailure);
  const resolution = resolutionOf(input);
  if (!resolution.ok) return resolution;
  const aspectRatio = aspectRatioOf(input);
  if (!aspectRatio.ok) return aspectRatio;
  return {
    ok: true,
    value: {
      model: input.model ?? options.configuredModel,
      prompt: input.prompt,
      durationSeconds: input.duration_seconds,
      aspectRatio: aspectRatio.value,
      resolution: resolution.value,
      fileStem: fileStem.value,
      firstFramePath: input.first_frame_path,
      lastFramePath: input.last_frame_path,
      referenceImagePaths: input.reference_image_paths ?? [],
    },
  };
}
