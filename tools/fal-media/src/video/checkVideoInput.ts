import { nearestAspectRatio } from "../catalog/shapes.ts";
import {
  findVideoModel,
  videoModels,
  type VideoModel,
} from "../catalog/video/index.ts";
import { checkFileStem, type Outcome } from "../toolResults.ts";
import { videoSettingFailure } from "./videoSettingFailure.ts";

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
  referenceImagePaths: string[];
}

function checkModel(id: string | undefined): Outcome<VideoModel, string> {
  const model = findVideoModel(id);
  if (model) return { ok: true, value: model };
  const ids = videoModels.map((entry) => entry.id).join(", ");
  return {
    ok: false,
    failure: `model "${String(id)}" is not a model of this server. Use one of: ${ids}.`,
  };
}

const defaultShape = { widthPixels: 16, heightPixels: 9 };

function aspectRatioOf(options: {
  model: VideoModel;
  input: VideoInput;
}): string {
  const { width_pixels: widthPixels, height_pixels: heightPixels } =
    options.input;
  const shape =
    widthPixels === undefined || heightPixels === undefined
      ? defaultShape
      : { widthPixels, heightPixels };
  return nearestAspectRatio({ ...shape, ratios: options.model.aspectRatios });
}

function withAudioOf(options: { model: VideoModel; input: VideoInput }) {
  if (options.model.sound === "always") return true;
  if (options.model.sound === "none") return false;
  return options.input.with_audio ?? true;
}

export function checkVideoInput(
  input: VideoInput,
): Outcome<CheckedVideoInput, string> {
  const model = checkModel(input.model);
  if (!model.ok) return model;
  const fileStem = checkFileStem(input.file_stem);
  if (!fileStem.ok) return fileStem;
  const settingFailure = videoSettingFailure({ model: model.value, input });
  if (settingFailure !== undefined)
    return { ok: false, failure: settingFailure };
  return {
    ok: true,
    value: {
      model: model.value,
      prompt: input.prompt,
      durationSeconds: input.duration_seconds,
      resolution: input.resolution ?? model.value.defaultResolution,
      withAudio: withAudioOf({ model: model.value, input }),
      aspectRatio: aspectRatioOf({ model: model.value, input }),
      outputDirectory: input.output_directory,
      fileStem: fileStem.value,
      referenceImagePaths: input.reference_image_paths ?? [],
      ...(input.first_frame_path === undefined
        ? {}
        : { firstFramePath: input.first_frame_path }),
      ...(input.last_frame_path === undefined
        ? {}
        : { lastFramePath: input.last_frame_path }),
    },
  };
}
