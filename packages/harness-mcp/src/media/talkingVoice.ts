import { join } from "node:path";
import type { JsonObject, ProjectSnapshot } from "@yumekit/project";
import { cutAudio } from "@yumekit/render";
import type { HarnessFailure, Outcome } from "../results.js";
import type { GenerateAssetInput } from "./generateAssetInput.js";

type VoicePart = NonNullable<GenerateAssetInput["voice_part"]>;

export interface TalkingVoice {
  file: string;
  part: VoicePart | undefined;
  seconds: number;
}

const frameTolerance = 1;

function invalid(options: { message: string; hint: string }) {
  return {
    ok: false as const,
    failure: { kind: "invalid-value", ...options },
  };
}

export function talkingVoiceOf(options: {
  snapshot: ProjectSnapshot;
  projectFolder: string;
  request: GenerateAssetInput;
}): Outcome<TalkingVoice | undefined, HarnessFailure> {
  const { snapshot, request } = options;
  const assetId = request.voice_asset_id;
  const part = request.voice_part;
  if (request.capability !== "talking-clip") {
    if (assetId === undefined && part === undefined) {
      return { ok: true, value: undefined };
    }
    return invalid({
      message: `voice_asset_id and voice_part are for a talking clip, not for ${request.capability}.`,
      hint: "Leave them out, or use the capability talking-clip.",
    });
  }
  const voices = snapshot.assets.filter((asset) => asset.kind === "audio");
  const voice = voices.find((asset) => asset.id === assetId);
  if (voice === undefined) {
    const ids = voices.map((asset) => asset.id);
    return {
      ok: false,
      failure: {
        kind: "asset-not-found",
        message:
          assetId === undefined
            ? "A talking clip needs voice_asset_id, the voice that the person speaks."
            : `The project has no audio asset "${assetId}".`,
        hint: `Use one of these audio asset ids: ${ids.length === 0 ? "none. Make the voice first with the capability speech" : ids.join(", ")}.`,
      },
    };
  }
  const { framesPerSecond } = snapshot.project;
  const voiceSeconds = (voice.durationFrames ?? 0) / framesPerSecond;
  if (
    part !== undefined &&
    part.start_seconds + part.duration_seconds >
      voiceSeconds + frameTolerance / framesPerSecond
  ) {
    return invalid({
      message: `voice_part ends at ${String(part.start_seconds + part.duration_seconds)} seconds, after the end of "${voice.id}" at ${voiceSeconds.toFixed(2)} seconds.`,
      hint: "Give a part inside the voice file, or leave out voice_part.",
    });
  }
  return {
    ok: true,
    value: {
      file: join(options.projectFolder, voice.file),
      part,
      seconds:
        part === undefined
          ? voiceSeconds
          : (part.lead_seconds ?? 0) + part.duration_seconds,
    },
  };
}

export async function voicePathInput(options: {
  voice: TalkingVoice | undefined;
  projectFolder: string;
  assetId: string;
}): Promise<Outcome<JsonObject, HarnessFailure>> {
  const { voice } = options;
  if (voice === undefined) return { ok: true, value: {} };
  if (voice.part === undefined) {
    return { ok: true, value: { audio_path: voice.file } };
  }
  const cut = await cutAudio({
    file: voice.file,
    startSeconds: voice.part.start_seconds,
    durationSeconds: voice.part.duration_seconds,
    leadSeconds: voice.part.lead_seconds ?? 0,
    target: join(
      options.projectFolder,
      ".cache",
      "voice-parts",
      `${options.assetId}.wav`,
    ),
  });
  if (!cut.ok) {
    return {
      ok: false,
      failure: {
        kind: "voice-part-failed",
        message: cut.failure.message,
        hint: cut.failure.hint ?? "Check the voice file, then call again.",
      },
    };
  }
  return { ok: true, value: { audio_path: cut.value.file } };
}
