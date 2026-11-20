import type { JsonObject, ProjectSnapshot } from "@yumekit/project";
import type { HarnessFailure } from "../results.js";

export type VideoLimitFailure = HarnessFailure & {
  used_seconds: number;
  requested_seconds: number;
  limit_seconds: number;
};

export function roundedSeconds(seconds: number): number {
  return Math.round(seconds * 100) / 100;
}

export function generatedVideoSecondsOf(snapshot: ProjectSnapshot): number {
  const secondsByFile = new Map<string, number>();
  for (const asset of snapshot.assets) {
    if (asset.kind !== "video" || asset.source.kind !== "tool") continue;
    secondsByFile.set(
      asset.file,
      (asset.durationFrames ?? 0) / snapshot.project.framesPerSecond,
    );
  }
  let total = 0;
  for (const seconds of secondsByFile.values()) total += seconds;
  return total;
}

export function videoLimitFailureOf(options: {
  snapshot: ProjectSnapshot;
  input: JsonObject;
  limitSeconds: number;
}): VideoLimitFailure | undefined {
  const { limitSeconds } = options;
  const requestedValue = options.input["duration_seconds"];
  const requested = typeof requestedValue === "number" ? requestedValue : 0;
  const used = roundedSeconds(generatedVideoSecondsOf(options.snapshot));
  const isTurnedOff = limitSeconds === 0;
  if (!isTurnedOff && used + requested <= limitSeconds) return undefined;
  const limitText = isTurnedOff
    ? "The limit is 0 seconds, so generated video is turned off."
    : `The limit is ${String(limitSeconds)} seconds.`;
  return {
    kind: "generated-video-limit-reached",
    message: `This call asks for ${String(requested)} seconds of generated video. The project already has ${String(used)} seconds. ${limitText} The person sets the limit with limits.generatedVideoSeconds in media-tools.json.`,
    hint: "Make no more video. Ask the person whether to raise limits.generatedVideoSeconds in media-tools.json, or use a shorter clip, a still image, or a code scene instead.",
    used_seconds: used,
    requested_seconds: requested,
    limit_seconds: limitSeconds,
  };
}
