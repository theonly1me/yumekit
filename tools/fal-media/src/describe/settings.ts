import type { AcceptedInput } from "../catalog/acceptedInput.ts";
import type { ImageModel } from "../catalog/image/index.ts";
import type { SoundModel } from "../catalog/sound/index.ts";
import type { TalkingModel } from "../catalog/talking/index.ts";
import { videoAccepts, type VideoModel } from "../catalog/video/index.ts";

export type MediaModelSetting =
  | {
      name: string;
      label: string;
      kind: "choice";
      choices: string[];
      default: string;
    }
  | {
      name: string;
      label: string;
      kind: "whole-number";
      minimum: number;
      maximum: number;
      default: number;
    }
  | { name: string; label: string; kind: "switch"; default: boolean }
  | { name: string; label: string; kind: "image-file" }
  | { name: string; label: string; kind: "image-files"; maximum: number };

function referenceSetting(maximum: number): MediaModelSetting {
  return {
    name: "reference_image_paths",
    label: "Reference pictures",
    kind: "image-files",
    maximum,
  };
}

export function videoSettings(model: VideoModel): MediaModelSetting[] {
  const { minimum, maximum } = model.durationSeconds;
  const accepts = videoAccepts(model);
  return [
    {
      name: "duration_seconds",
      label: "Length in seconds",
      kind: "whole-number",
      minimum,
      maximum,
      default: model.durationSeconds.default,
    },
    {
      name: "resolution",
      label: "Resolution",
      kind: "choice",
      choices: [...model.resolutions],
      default: model.defaultResolution,
    },
    ...(model.sound === "switch"
      ? [
          {
            name: "with_audio",
            label: "Sound",
            kind: "switch" as const,
            default: true,
          },
        ]
      : []),
    { name: "first_frame_path", label: "First frame", kind: "image-file" },
    ...(accepts.includes("last_frame")
      ? [
          {
            name: "last_frame_path",
            label: "Last frame",
            kind: "image-file" as const,
          },
        ]
      : []),
    ...(model.references === undefined
      ? []
      : [referenceSetting(model.references.maximum)]),
  ];
}

export function imageSettings(model: ImageModel): MediaModelSetting[] {
  return [
    ...model.choiceSettings.map((setting) => ({
      name: setting.name,
      label: setting.label,
      kind: "choice" as const,
      choices: [...setting.choices],
      default: setting.default,
    })),
    ...(model.transparentBackground
      ? [
          {
            name: "transparent_background",
            label: "Transparent background",
            kind: "switch" as const,
            default: false,
          },
        ]
      : []),
    ...(model.references === undefined
      ? []
      : [referenceSetting(model.references.maximum)]),
  ];
}

export function imageAccepts(model: ImageModel): AcceptedInput[] {
  return model.references === undefined ? [] : ["reference_images"];
}

export function soundSettings(model: SoundModel): MediaModelSetting[] {
  return [
    {
      name: "duration_seconds",
      label: "Length in seconds",
      kind: "whole-number",
      ...model.durationSeconds,
    },
  ];
}

export const sharperSettings: MediaModelSetting[] = [
  {
    name: "scale",
    label: "Times larger",
    kind: "whole-number",
    minimum: 2,
    maximum: 4,
    default: 2,
  },
];

export function talkingSettings(model: TalkingModel): MediaModelSetting[] {
  const { resolutions } = model;
  if (resolutions === undefined) return [];
  return [
    {
      name: "resolution",
      label: "Resolution",
      kind: "choice",
      choices: [...resolutions.choices],
      default: resolutions.default,
    },
  ];
}
