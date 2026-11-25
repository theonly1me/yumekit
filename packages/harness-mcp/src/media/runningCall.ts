import type { JsonObject } from "@yumekit/project";
import type { HarnessContext } from "../context.js";
import type { HarnessFailure, Outcome } from "../results.js";
import type { WorkTicket } from "../work/board/workBoard.js";
import type { GenerateAssetInput } from "./generateAssetInput.js";
import { roundedSeconds, videoLimitFailureOf } from "./videoLimit.js";

const whatByCapability: Record<GenerateAssetInput["capability"], string> = {
  image: "a picture",
  speech: "a voice",
  music: "music",
  video: "a video clip",
  "sound-effect": "a sound",
  "talking-clip": "a talking clip",
  sharper: "a sharper copy",
};

function secondsOf(input: JsonObject): number {
  const value = input["duration_seconds"];
  return typeof value === "number" ? value : 0;
}

export function startMediaCall(options: {
  context: HarnessContext;
  request: GenerateAssetInput;
  voiceSeconds: number | undefined;
}): Outcome<WorkTicket, HarnessFailure> {
  const { context, request, voiceSeconds } = options;
  const isVideo = request.capability === "video" || voiceSeconds !== undefined;
  const input =
    voiceSeconds === undefined
      ? request.input
      : { duration_seconds: roundedSeconds(voiceSeconds) };
  if (isVideo) {
    const limitFailure = videoLimitFailureOf({
      snapshot: context.store.read(),
      input,
      limitSeconds: context.mediaTools.limits().generatedVideoSeconds,
      runningSeconds: context.board.reservedVideoSeconds(),
    });
    if (limitFailure) return { ok: false, failure: limitFailure };
  }
  return context.board.start({
    id: request.asset_id,
    kind: "media",
    what: whatByCapability[request.capability],
    subject: request.asset_id,
    ...(request.shot_id === undefined ? {} : { shotId: request.shot_id }),
    ...(request.sheet_of === undefined ? {} : { castId: request.sheet_of }),
    ...(request.server === undefined ? {} : { server: request.server }),
    state: "waiting",
    videoSeconds: isVideo ? secondsOf(input) : 0,
  });
}
