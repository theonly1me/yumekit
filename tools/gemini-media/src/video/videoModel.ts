export const videoModel = {
  id: "gemini-omni-1.2-flash",
  label: "Gemini Omni 1.2 Flash",
  modelVariable: "YUMEKIT_GEMINI_VIDEO_MODEL",
  shortestSeconds: 3,
  longestSeconds: 15,
  longestSecondsWithLastFrame: 10,
  defaultSeconds: 5,
  maximumReferenceImages: 6,
  resolutions: ["720p", "1080p"],
  defaultResolution: "720p",
  usdPerMillionVideoTokens: 12,
  priceVariable: "YUMEKIT_GEMINI_VIDEO_USD_PER_MILLION_TOKENS",
  usdPerSecondAt720p: 0.07,
  usdPerSecondAt1080p: 0.104,
  readOn: "2026-11-21",
} as const;

export type Resolution = (typeof videoModel.resolutions)[number];

export function isResolution(value: string): value is Resolution {
  return videoModel.resolutions.some((resolution) => resolution === value);
}
