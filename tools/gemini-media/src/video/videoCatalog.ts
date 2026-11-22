import type { CatalogEntry } from "../describe/mediaServerDescription.ts";
import { videoModel } from "./videoModel.ts";

export const videoCatalog: CatalogEntry[] = [
  {
    sourceUrl: "https://aistudio.google.com/docs/omni",
    model: {
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
      accepts: ["first_frame", "last_frame", "reference_images"],
      tested: false,
    },
  },
];
