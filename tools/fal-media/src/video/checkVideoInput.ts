import {
  findVideoModel,
  nearestAspectRatio,
  videoModels,
  type VideoModel,
} from "../catalog/index.ts";
import { checkFileStem, type Outcome } from "../toolResults.ts";

export interface VideoInput {
  prompt: string;
  duration_seconds: number;
  output_directory: string;
  file_stem: string;
  model?: string | undefined;
  resolution?: string | undefined;
  with_audio?: boolean | undefined;
  first_frame_path?: string | undefined;
  last_frame_path?: string | undefined;
  reference_image_paths?: string[] | undefined;
  width_pixels?: number | undefined;
  height_pixels?: number | undefined;
}

export interface CheckedVideoInput {
  model: VideoModel;
  prompt: string;
  durationSeconds: number;
  resolution: string;
  withAudio: boolean;
  aspectRatio: string;
  outputDirectory: string;
  fileStem: string;
  firstFramePath?: string;
  lastFramePath?: string;
}

const defaultAspectRatio = "16:9";

function checkModel(id: string | undefined): Outcome<VideoModel, string> {
  const model = findVideoModel(id);
  if (model) return { ok: true, value: model };
  const ids = videoModels.map((entry) => entry.id).join(", ");
  return {
    ok: false,
    failure: `model "${String(id)}" is not a model of this server. Use one of: ${ids}.`,
  };
}

function checkSettings(options: {
  model: VideoModel;
  input: VideoInput;
}): string | undefined {
  const { model, input } = options;
  const { minimum, maximum } = model.durationSeconds;
  const length = input.duration_seconds;
  if (!Number.isInteger(length) || length < minimum || length > maximum) {
    return `duration_seconds must be a whole number from ${String(minimum)} to ${String(maximum)} for ${model.label}.`;
  }
  if (
    input.resolution !== undefined &&
    !model.resolutions.includes(input.resolution)
  ) {
    return `resolution must be one of ${model.resolutions.join(", ")} for ${model.label}.`;
  }
  if ((input.reference_image_paths ?? []).length > 0) {
    return `${model.label} does not accept reference_image_paths. Give first_frame_path and last_frame_path in their place.`;
  }
  if (input.last_frame_path !== undefined) {
    if (input.first_frame_path === undefined) {
      return "last_frame_path needs first_frame_path.";
    }
    if (!model.imageToVideo.acceptsLastFrame) {
      return `${model.label} does not accept last_frame_path.`;
    }
  }
  if (
    (input.width_pixels === undefined) !==
    (input.height_pixels === undefined)
  ) {
    return "Give both width_pixels and height_pixels, or neither.";
  }
  return undefined;
}

function aspectRatioOf(options: {
  model: VideoModel;
  input: VideoInput;
}): string {
  const { width_pixels: widthPixels, height_pixels: heightPixels } =
    options.input;
  if (widthPixels === undefined || heightPixels === undefined) {
    return defaultAspectRatio;
  }
  return nearestAspectRatio({
    model: options.model,
    widthPixels,
    heightPixels,
  });
}

export function checkVideoInput(
  input: VideoInput,
): Outcome<CheckedVideoInput, string> {
  const model = checkModel(input.model);
  if (!model.ok) return model;
  const fileStem = checkFileStem(input.file_stem);
  if (!fileStem.ok) return fileStem;
  const settingFailure = checkSettings({ model: model.value, input });
  if (settingFailure !== undefined)
    return { ok: false, failure: settingFailure };
  return {
    ok: true,
    value: {
      model: model.value,
      prompt: input.prompt,
      durationSeconds: input.duration_seconds,
      resolution: input.resolution ?? model.value.defaultResolution,
      withAudio: input.with_audio ?? true,
      aspectRatio: aspectRatioOf({ model: model.value, input }),
      outputDirectory: input.output_directory,
      fileStem: fileStem.value,
      ...(input.first_frame_path === undefined
        ? {}
        : { firstFramePath: input.first_frame_path }),
      ...(input.last_frame_path === undefined
        ? {}
        : { lastFramePath: input.last_frame_path }),
    },
  };
}
