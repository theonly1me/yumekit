import type { Asset, JsonObject, ProjectSnapshot } from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import { uniqueId } from "../timeline/narrationPlan.js";
import { voiceTrackOf } from "./soundRoles.js";

const keptSpeechInputs = ["voice", "pronunciations", "instructions", "speed"];

export interface VoiceChoice {
  text: string;
  voice: string | undefined;
  server: string | undefined;
  model: string | undefined;
  pronunciations: Record<string, string> | undefined;
}

export function earlierVoiceOf(snapshot: ProjectSnapshot): Asset | undefined {
  for (const timeline of snapshot.timelines) {
    const track = voiceTrackOf({ timeline, assets: snapshot.assets });
    const [clip] = track?.clips ?? [];
    const asset = snapshot.assets.find(
      (candidate) => candidate.id === clip?.assetId,
    );
    if (asset !== undefined) return asset;
  }
  return undefined;
}

function keptInputOf(earlier: Asset | undefined): JsonObject {
  if (earlier?.source.kind !== "tool") return {};
  const { input } = earlier.source;
  return Object.fromEntries(
    keptSpeechInputs.flatMap((name) => {
      const value = input[name];
      return value === undefined ? [] : [[name, value]];
    }),
  );
}

function keptServerOf(options: {
  earlier: Asset | undefined;
  choice: VoiceChoice;
}): { server?: string; model?: string } {
  const { earlier, choice } = options;
  if (choice.server !== undefined) {
    return {
      server: choice.server,
      ...(choice.model === undefined ? {} : { model: choice.model }),
    };
  }
  if (choice.voice !== undefined || earlier?.source.kind !== "tool") return {};
  const { server, model } = earlier.source;
  return { server, ...(model === undefined ? {} : { model }) };
}

export function voiceRequestOf(options: {
  snapshot: ProjectSnapshot;
  choice: VoiceChoice;
}): GenerateAssetInput {
  const { snapshot, choice } = options;
  const earlier = earlierVoiceOf(snapshot);
  return {
    asset_id: uniqueId({
      base: "voice",
      taken: snapshot.assets.map((asset) => asset.id),
    }),
    capability: "speech",
    ...keptServerOf({ earlier, choice }),
    input: {
      ...keptInputOf(earlier),
      ...(choice.voice === undefined ? {} : { voice: choice.voice }),
      ...(choice.pronunciations === undefined
        ? {}
        : { pronunciations: choice.pronunciations }),
      text: choice.text,
    },
  };
}
