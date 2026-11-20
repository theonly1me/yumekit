import { videoModels, type VideoModel } from "../catalog/index.ts";
import { getKeyUrl } from "../falApi.ts";

type MediaModelSetting =
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
  | { name: string; label: string; kind: "image-file" };

function settingsOf(model: VideoModel): MediaModelSetting[] {
  return [
    {
      name: "duration_seconds",
      label: "Length in seconds",
      kind: "whole-number",
      ...model.durationSeconds,
    },
    {
      name: "resolution",
      label: "Resolution",
      kind: "choice",
      choices: [...model.resolutions],
      default: model.defaultResolution,
    },
    { name: "with_audio", label: "Sound", kind: "switch", default: true },
    { name: "first_frame_path", label: "First frame", kind: "image-file" },
    ...(model.imageToVideo.acceptsLastFrame
      ? [
          {
            name: "last_frame_path",
            label: "Last frame",
            kind: "image-file" as const,
          },
        ]
      : []),
  ];
}

function pricesOf(model: VideoModel) {
  return Object.entries(model.usdPerSecondByResolution).flatMap(
    ([resolution, usd]) =>
      usd === undefined
        ? []
        : [{ usd, unit: "second" as const, when: { resolution } }],
  );
}

export function describeServer() {
  return {
    label: "fal",
    runs: "hosted" as const,
    keys: [
      {
        variable: "FAL_KEY",
        label: "fal API key",
        get_key_url: getKeyUrl,
        steps: [
          "Sign in to fal.ai.",
          "Open the keys page of the dashboard.",
          "Add a key with the API preset.",
          "Copy the key. fal shows it one time only.",
        ],
      },
    ],
    models: videoModels.map((model) => ({
      id: model.id,
      label: model.label,
      capability: "video" as const,
      is_default: model.isDefault,
      settings: settingsOf(model),
      prices: pricesOf(model),
      read_on: model.readOn,
    })),
  };
}
