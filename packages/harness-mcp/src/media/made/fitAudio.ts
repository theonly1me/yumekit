import { join } from "node:path";
import { cutAudio, probeMedia } from "@yumekit/render";
import type { Capability, JsonObject } from "@yumekit/tools";
import { renderFailureOf } from "../../output/renderFailures.js";
import type { HarnessFailure, Outcome } from "../../results.js";
import { roundedSeconds } from "../videoLimit.js";

const capabilitiesWithAskedLength: Capability[] = ["music", "sound-effect"];
const toleranceSeconds = 0.25;
const longestFadeSeconds = 1;

export interface AudioLength {
  path: string;
  askedSeconds?: number;
  realSeconds?: number;
  originalSeconds?: number;
  fit?: { originalPath: string; seconds: number; fadeOutSeconds: number };
}

export function fadeOutSecondsOf(seconds: number): number {
  return roundedSeconds(Math.min(longestFadeSeconds, seconds / 10));
}

export async function fitToAskedLength(options: {
  capability: Capability;
  input: JsonObject;
  path: string;
  reportedSeconds: number | undefined;
  assetFolder: string;
  fileStem: string;
}): Promise<Outcome<AudioLength, HarnessFailure>> {
  const { path } = options;
  const asked = options.input["duration_seconds"];
  if (
    !capabilitiesWithAskedLength.includes(options.capability) ||
    typeof asked !== "number"
  ) {
    return { ok: true, value: { path } };
  }
  const probed = await probeMedia({ file: path });
  const realSeconds =
    (probed.ok ? probed.value.durationSeconds : undefined) ??
    options.reportedSeconds;
  if (realSeconds === undefined || realSeconds <= asked + toleranceSeconds) {
    return {
      ok: true,
      value: {
        path,
        askedSeconds: asked,
        ...(realSeconds === undefined
          ? {}
          : { realSeconds: roundedSeconds(realSeconds) }),
      },
    };
  }
  const fadeOutSeconds = fadeOutSecondsOf(asked);
  const target = join(options.assetFolder, `${options.fileStem}-fitted.wav`);
  const cut = await cutAudio({
    file: path,
    startSeconds: 0,
    durationSeconds: asked,
    leadSeconds: 0,
    fadeOutSeconds,
    target,
  });
  if (!cut.ok) return { ok: false, failure: renderFailureOf(cut.failure) };
  return {
    ok: true,
    value: {
      path: target,
      askedSeconds: asked,
      realSeconds: asked,
      originalSeconds: roundedSeconds(realSeconds),
      fit: { originalPath: path, seconds: asked, fadeOutSeconds },
    },
  };
}

export function lengthNoteOf(length: AudioLength): string | undefined {
  const { askedSeconds, realSeconds, originalSeconds } = length;
  if (askedSeconds === undefined || realSeconds === undefined) return undefined;
  if (originalSeconds !== undefined) {
    return `The model made ${String(originalSeconds)} seconds for the asked ${String(askedSeconds)}. yumekit cut it to ${String(askedSeconds)} seconds with a ${String(length.fit?.fadeOutSeconds ?? 0)} second fade at the end, and kept the original file.`;
  }
  if (realSeconds < askedSeconds - toleranceSeconds) {
    return `The model made ${String(realSeconds)} seconds, shorter than the asked ${String(askedSeconds)}. Place it with its real length, or ask again.`;
  }
  return undefined;
}
