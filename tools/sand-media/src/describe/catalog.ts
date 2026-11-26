import { keyVariable, sandUrls } from "../sandApi.ts";
import { videoModel } from "../video/videoModel.ts";

export const catalog = {
  label: "Sand AI",
  runs: "hosted",
  keys: [
    {
      variable: keyVariable,
      label: "Sand AI API key",
      get_key_url: sandUrls.keys,
      steps: [
        "Sign in to the Sand AI platform at platform.sand.ai.",
        "Open the API keys page and choose Create API key.",
        "Enter a name, for example yumekit, and submit.",
        "Copy the full key before you close the dialog. Sand AI shows it one time only.",
        "Check your balance on the Usage page, because each second of video uses credits.",
      ],
    },
  ],
  models: [
    {
      id: videoModel.id,
      label: videoModel.label,
      capability: "video",
      is_default: true,
      settings: [
        {
          name: "duration_seconds",
          label: "Length in seconds",
          kind: "whole-number",
          minimum: videoModel.shortestSeconds,
          maximum: videoModel.longestSeconds,
          default: videoModel.defaultSeconds,
        },
        {
          name: "resolution",
          label: "Resolution",
          kind: "choice",
          choices: [videoModel.resolution],
          default: videoModel.resolution,
        },
        { name: "with_audio", label: "Sound", kind: "switch", default: true },
        { name: "first_frame_path", label: "First frame", kind: "image-file" },
        { name: "last_frame_path", label: "Last frame", kind: "image-file" },
        {
          name: "reference_image_paths",
          label: "Reference pictures",
          kind: "image-files",
          maximum: videoModel.maximumReferencePictures,
        },
      ],
      prices: [
        {
          usd: videoModel.usdPerSecond,
          unit: "second",
          when: { resolution: videoModel.resolution },
        },
      ],
      read_on: videoModel.readOn,
      accepts: ["first_frame", "last_frame", "reference_images"],
      tested: false,
    },
  ],
} as const;
