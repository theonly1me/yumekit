import type { Asset } from "@yumekit/project";
import type { HarnessFailure } from "../results.js";

export const testServerName = "sample";

export function isTestServerAsset(asset: Asset): boolean {
  return asset.source.kind === "tool" && asset.source.server === testServerName;
}

function secondsText(options: {
  frames: number;
  framesPerSecond: number;
}): string {
  const seconds =
    Math.round((options.frames / options.framesPerSecond) * 10) / 10;
  return `${String(seconds)} seconds`;
}

export function tooShortFailureOf(options: {
  assetFrames: number;
  videoFrames: number;
  framesPerSecond: number;
  isPartial: boolean;
}): HarnessFailure | undefined {
  const { assetFrames, videoFrames, framesPerSecond } = options;
  if (options.isPartial || assetFrames * 3 >= videoFrames * 2) return undefined;
  const voice = secondsText({ frames: assetFrames, framesPerSecond });
  const video = secondsText({ frames: videoFrames, framesPerSecond });
  return {
    kind: "narration-too-short",
    message: `The voice is ${voice} long and the video is ${video} long. A voice covers the whole video.`,
    hint: "Make the voice again with one line of the script for each scene, so it covers the whole video. If this voice covers only one part on purpose, call place_narration again with partial true.",
  };
}
