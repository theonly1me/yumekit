import type { VideoModel } from "../catalog/video/index.ts";
import type { VideoInput } from "./checkVideoInput.ts";

interface SettingCheck {
  model: VideoModel;
  input: VideoInput;
}

function lengthFailure({ model, input }: SettingCheck): string | undefined {
  const { minimum, maximum, allowed } = model.durationSeconds;
  const length = input.duration_seconds;
  if (allowed !== undefined && !allowed.includes(length)) {
    return `duration_seconds must be one of ${allowed.join(", ")} for ${model.label}.`;
  }
  if (!Number.isInteger(length) || length < minimum || length > maximum) {
    return `duration_seconds must be a whole number from ${String(minimum)} to ${String(maximum)} for ${model.label}.`;
  }
  return undefined;
}

function soundFailure({ model, input }: SettingCheck): string | undefined {
  if (model.sound === "always" && input.with_audio === false) {
    return `${model.label} always makes sound. To leave the sound out, place the clip with sound_gain_decibels set to off.`;
  }
  if (model.sound === "none" && input.with_audio !== undefined) {
    return `${model.label} has no sound setting on fal. Leave out with_audio.`;
  }
  return undefined;
}

function referenceFailure({ model, input }: SettingCheck): string | undefined {
  const count = (input.reference_image_paths ?? []).length;
  if (count === 0) return undefined;
  if (model.references === undefined) {
    return `${model.label} does not accept reference_image_paths. Give first_frame_path and last_frame_path in their place.`;
  }
  if (count > model.references.maximum) {
    return `${model.label} accepts at most ${String(model.references.maximum)} reference_image_paths.`;
  }
  if (input.first_frame_path !== undefined) {
    return `${model.label} takes reference_image_paths only without first_frame_path.`;
  }
  return undefined;
}

function lastFrameFailure({ model, input }: SettingCheck): string | undefined {
  if (input.last_frame_path === undefined) return undefined;
  if (input.first_frame_path === undefined) {
    return "last_frame_path needs first_frame_path.";
  }
  const { acceptsLastFrame, lastFrameMaximumSeconds } = model.firstFrame;
  if (!acceptsLastFrame)
    return `${model.label} does not accept last_frame_path.`;
  if (
    lastFrameMaximumSeconds !== undefined &&
    input.duration_seconds > lastFrameMaximumSeconds
  ) {
    return `${model.label} accepts last_frame_path only up to ${String(lastFrameMaximumSeconds)} seconds.`;
  }
  return undefined;
}

function resolutionFailure({ model, input }: SettingCheck): string | undefined {
  if (input.resolution === undefined) return undefined;
  if (model.resolutions.includes(input.resolution)) return undefined;
  return `resolution must be one of ${model.resolutions.join(", ")} for ${model.label}.`;
}

function sizeFailure({ input }: SettingCheck): string | undefined {
  if (
    (input.width_pixels === undefined) ===
    (input.height_pixels === undefined)
  ) {
    return undefined;
  }
  return "Give both width_pixels and height_pixels, or neither.";
}

const checks = [
  lengthFailure,
  resolutionFailure,
  soundFailure,
  referenceFailure,
  lastFrameFailure,
  sizeFailure,
];

export function videoSettingFailure(check: SettingCheck): string | undefined {
  for (const failureOf of checks) {
    const failure = failureOf(check);
    if (failure !== undefined) return failure;
  }
  return undefined;
}
