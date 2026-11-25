import type { MediaModel, MediaTools } from "@yumekit/tools";

export interface ModelLimits {
  capability: "image" | "video";
  model: string | undefined;
  lines: string[];
}

function lengthLineOf(model: MediaModel): string | undefined {
  const setting = model.settings.find(
    (candidate) => candidate.name === "duration_seconds",
  );
  if (setting?.kind === "whole-number") {
    return `A clip is ${String(setting.minimum)} to ${String(setting.maximum)} seconds long.`;
  }
  if (setting?.kind === "choice") {
    return `A clip is one of these lengths in seconds: ${setting.choices.join(", ")}.`;
  }
  return undefined;
}

function referenceLineOf(model: MediaModel): string {
  const setting = model.settings.find(
    (candidate) => candidate.name === "reference_image_paths",
  );
  return setting?.kind === "image-files"
    ? `It takes up to ${String(setting.maximum)} reference pictures.`
    : "It takes no reference pictures.";
}

function videoLinesOf(model: MediaModel): string[] {
  const accepts = model.accepts ?? [];
  return [
    accepts.includes("first_frame")
      ? "It starts on a first frame. A clip with first_frame_asset_id sends that picture as its only picture: no reference pictures with it (first-frame-only)."
      : "It takes no first frame, so the prompt alone sets the look.",
    accepts.includes("last_frame")
      ? "It can end on a last frame (last_frame_asset_id)."
      : "It takes no last frame.",
    ...(accepts.includes("reference_images") ? [referenceLineOf(model)] : []),
    ...[lengthLineOf(model)].filter((line) => line !== undefined),
  ];
}

export async function modelLimitsOf(options: {
  mediaTools: MediaTools;
  capability: "image" | "video";
  server: string | undefined;
  model: string | undefined;
}): Promise<ModelLimits> {
  const { capability } = options;
  const chosen = await options.mediaTools.chosenModel({
    capability,
    ...(options.server === undefined ? {} : { server: options.server }),
    ...(options.model === undefined ? {} : { model: options.model }),
  });
  if (chosen === undefined) {
    return {
      capability,
      model: undefined,
      lines: [
        "No connected service describes this model, so yumekit knows none of its limits.",
      ],
    };
  }
  return {
    capability,
    model: chosen.id,
    lines:
      capability === "video" ? videoLinesOf(chosen) : [referenceLineOf(chosen)],
  };
}
