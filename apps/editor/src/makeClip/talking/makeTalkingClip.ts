import type { EngineClient } from "../../engine/engineClient.js";
import type { Asset, Output, SceneClip } from "../../engine/snapshot.js";
import type { MakeOutcome } from "../makeClip.js";
import type { ModelChoice } from "../modelChoices.js";
import { durationSettingName, type SettingValues } from "../settingValues.js";
import { callTool, textField, uniqueAssetId } from "../toolCalls.js";
import type { SceneVoice, Speaker } from "./talkingFacts.js";

function toolInputOf(values: SettingValues): SettingValues {
  return Object.fromEntries(
    Object.entries(values).filter(([name]) => name !== durationSettingName),
  );
}

export async function makeTalkingClip(options: {
  client: EngineClient;
  choice: ModelChoice;
  values: SettingValues;
  speaker: Speaker;
  voice: SceneVoice;
  outputs: [Output, ...Output[]];
  clip: SceneClip;
  assets: Asset[];
  callId: string;
}): Promise<MakeOutcome> {
  const { client, choice, clip, voice, outputs } = options;
  const generated = await callTool({
    client,
    name: "generate_asset",
    callId: options.callId,
    input: {
      asset_id: uniqueAssetId({
        base: `talking-${clip.sceneId}`,
        assets: options.assets,
      }),
      capability: "talking-clip",
      server: choice.server.server,
      model: choice.model.id,
      input: toolInputOf(options.values),
      media_asset_id: options.speaker.assetId,
      voice_asset_id: voice.assetId,
      voice_part: {
        start_seconds: voice.startSeconds,
        duration_seconds: voice.lengthSeconds,
        lead_seconds: voice.leadSeconds,
      },
    },
  });
  if (!generated.ok) return generated;
  const assetId = textField({ data: generated.data, name: "asset_id" });
  const sceneClipIds: string[] = [];
  for (const output of outputs) {
    const placed = await callTool({
      client,
      name: "place_video",
      input: {
        output_id: output.id,
        asset_id: assetId,
        replace_clip_id: clip.id,
        sound_gain_decibels: Math.min(0, voice.gainDecibels),
        quiet_voice: true,
      },
    });
    if (!placed.ok) return placed;
    sceneClipIds.push(textField({ data: placed.data, name: "scene_clip_id" }));
  }
  const [sceneClipId = ""] = sceneClipIds;
  return {
    ok: true,
    made: { assetId, sceneClipId, startFrame: clip.startFrame, outputs },
  };
}
