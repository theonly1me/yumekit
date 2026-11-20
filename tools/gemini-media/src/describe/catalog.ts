import { videoModel } from "../video/videoModel.ts";
import type { MediaServerDescription } from "./mediaServerDescription.ts";

export const catalog: MediaServerDescription = {
  label: "Google Gemini",
  runs: "hosted",
  keys: [
    {
      variable: "GEMINI_API_KEY",
      label: "Gemini API key",
      get_key_url: "https://aistudio.google.com/apikey",
      steps: [
        "Open Google AI Studio and sign in with your Google account.",
        "On the API Keys page, create a key in a Google Cloud project.",
        "Set up billing for that project, because video has no free tier.",
        "Copy the key and save it as GEMINI_API_KEY.",
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
          choices: [...videoModel.resolutions],
          default: videoModel.defaultResolution,
        },
        { name: "first_frame_path", label: "First frame", kind: "image-file" },
        { name: "last_frame_path", label: "Last frame", kind: "image-file" },
        {
          name: "reference_image_paths",
          label: "Reference images",
          kind: "image-files",
          maximum: videoModel.maximumReferenceImages,
        },
      ],
      prices: [
        {
          usd: videoModel.usdPerSecondAt720p,
          unit: "second",
          when: { resolution: "720p" },
        },
        {
          usd: videoModel.usdPerSecondAt1080p,
          unit: "second",
          when: { resolution: "1080p" },
        },
      ],
      read_on: videoModel.readOn,
    },
  ],
};
