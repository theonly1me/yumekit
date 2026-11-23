import type { ProjectSnapshot } from "@yumekit/project";
import type { HarnessContext } from "../context.js";
import type { ProgressListener } from "../harness/toolTable.js";
import { failureResult } from "../results.js";
import { assetOf, makeAsset, type MadeAsset } from "./makeAsset.js";
import {
  notInScriptFailureOf,
  scriptLinesOf,
  spokenTextOf,
} from "./scriptText.js";
import { voiceTrackOf } from "./soundRoles.js";
import { voiceRequestOf, type VoiceChoice } from "./voiceRequest.js";

export interface VoiceWish {
  text: string | undefined;
  assetId: string | undefined;
  choice: Omit<VoiceChoice, "text">;
}

export type MadeVoices =
  | { ok: true; assets: Extract<MadeAsset, { ok: true }>["asset"][] }
  | Extract<MadeAsset, { ok: false }>;

function earlierClipCountOf(snapshot: ProjectSnapshot): number {
  for (const timeline of snapshot.timelines) {
    const track = voiceTrackOf({ timeline, assets: snapshot.assets });
    if (track !== undefined && track.clips.length > 0) {
      return track.clips.length;
    }
  }
  return 0;
}

function placedVoiceOf(options: { snapshot: ProjectSnapshot; text: string }) {
  const { snapshot, text } = options;
  const placedIds = new Set(
    snapshot.timelines.flatMap((timeline) =>
      (voiceTrackOf({ timeline, assets: snapshot.assets })?.clips ?? []).map(
        (clip) => clip.assetId,
      ),
    ),
  );
  const asset = snapshot.assets.find(
    (candidate) =>
      placedIds.has(candidate.id) &&
      candidate.durationFrames !== undefined &&
      spokenTextOf(candidate)?.trim() === text,
  );
  return asset?.durationFrames === undefined
    ? undefined
    : { ...asset, durationFrames: asset.durationFrames };
}

export function textsToRecordOf(options: {
  snapshot: ProjectSnapshot;
  text: string | undefined;
}): string[] {
  const { snapshot, text } = options;
  if (text !== undefined) return [text];
  const lines = scriptLinesOf(snapshot.script);
  const isLineByLine =
    lines.length > 1 && earlierClipCountOf(snapshot) === lines.length;
  return isLineByLine ? lines : [snapshot.script.trim()];
}

export async function recordVoices(options: {
  context: HarnessContext;
  wish: VoiceWish;
  onProgress: ProgressListener | undefined;
}): Promise<MadeVoices> {
  const { context, wish } = options;
  if (wish.assetId !== undefined) {
    const made = assetOf({ context, assetId: wish.assetId });
    return made.ok ? { ok: true, assets: [made.asset] } : made;
  }
  const snapshot = context.store.read();
  const texts = textsToRecordOf({ snapshot, text: wish.text });
  for (const text of texts) {
    const notInScript = notInScriptFailureOf({
      script: snapshot.script,
      text,
    });
    if (notInScript !== undefined) {
      return { ok: false, result: failureResult(notInScript) };
    }
  }
  const assets = [];
  const keepsTheVoice =
    wish.choice.voice === undefined && wish.choice.server === undefined;
  for (const text of texts) {
    const kept = keepsTheVoice ? placedVoiceOf({ snapshot, text }) : undefined;
    if (kept !== undefined) {
      assets.push(kept);
      continue;
    }
    const made = await makeAsset({
      context,
      request: voiceRequestOf({
        snapshot: context.store.read(),
        choice: { ...wish.choice, text },
      }),
      onProgress: options.onProgress,
    });
    if (!made.ok) return made;
    assets.push(made.asset);
  }
  return { ok: true, assets };
}
