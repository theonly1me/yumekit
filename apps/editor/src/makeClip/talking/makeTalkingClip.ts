import type { Asset, Output, SceneClip } from "../../engine/snapshot.js";
import {
  talkingClipRequest,
  type ExactRequest,
} from "../../lead/exactRequests.js";
import { placeSteps } from "../makeClip.js";
import type { ModelChoice } from "../modelChoices.js";
import { durationSettingName, type SettingValues } from "../settingValues.js";
import { uniqueAssetId } from "../toolCalls.js";
import type { SceneVoice, Speaker } from "./talkingFacts.js";

function toolInputOf(values: SettingValues): SettingValues {
  return Object.fromEntries(
    Object.entries(values).filter(([name]) => name !== durationSettingName),
  );
}

export function talkingRequestOf(options: {
  choice: ModelChoice;
  values: SettingValues;
  speaker: Speaker;
  voice: SceneVoice;
  outputs: Output[];
  clip: SceneClip;
  assets: Asset[];
}): { assetId: string; request: ExactRequest } {
  const { choice, clip, voice, outputs } = options;
  const assetId = uniqueAssetId({
    base: `talking-${clip.sceneId}`,
    assets: options.assets,
  });
  return {
    assetId,
    request: talkingClipRequest({
      speakerName: options.speaker.name,
      modelLabel: choice.model.label,
      aboutClipId: clip.id,
      steps: [
        {
          tool: "generate_asset",
          input: {
            asset_id: assetId,
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
        },
        ...placeSteps({
          assetId,
          clipId: clip.id,
          outputs,
          extra: {
            sound_gain_decibels: Math.min(0, voice.gainDecibels),
            quiet_voice: true,
          },
        }),
      ],
    }),
  };
}
