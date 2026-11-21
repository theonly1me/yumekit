import type { EngineClient } from "../engine/engineClient.js";
import type { Asset, Output, SceneClip } from "../engine/snapshot.js";
import type { ModelChoice } from "./modelChoices.js";
import type { SettingValues } from "./settingValues.js";
import {
  callTool,
  textField,
  uniqueAssetId,
  type ToolFailure,
} from "./toolCalls.js";

export interface MadeClip {
  assetId: string;
  sceneClipId: string;
  startFrame: number;
}

export type MakeOutcome =
  { ok: true; made: MadeClip } | { ok: false; failure: ToolFailure };

function sizeInput(options: { choice: ModelChoice; output: Output }) {
  const names = new Set(options.choice.model.settings.map((each) => each.name));
  const isVideo = options.choice.model.capability === "video";
  return isVideo || (names.has("width_pixels") && names.has("height_pixels"))
    ? {
        width_pixels: options.output.widthPixels,
        height_pixels: options.output.heightPixels,
      }
    : {};
}

export async function makeStill(options: {
  client: EngineClient;
  choice: ModelChoice;
  prompt: string;
  output: Output;
  assets: Asset[];
  sceneId: string;
}): Promise<
  { ok: true; assetId: string } | { ok: false; failure: ToolFailure }
> {
  const { choice } = options;
  const made = await callTool({
    client: options.client,
    name: "generate_asset",
    input: {
      asset_id: uniqueAssetId({
        base: `still-${options.sceneId}`,
        assets: options.assets,
      }),
      capability: "image",
      server: choice.server.server,
      model: choice.model.id,
      input: { prompt: options.prompt, ...sizeInput(options) },
    },
  });
  if (!made.ok) return made;
  return {
    ok: true,
    assetId: textField({ data: made.data, name: "asset_id" }),
  };
}

export async function makeClip(options: {
  client: EngineClient;
  choice: ModelChoice;
  prompt: string;
  values: SettingValues;
  firstFrameAssetId: string;
  referenceAssetIds: string[];
  output: Output;
  clip: SceneClip;
  assets: Asset[];
  callId: string;
}): Promise<MakeOutcome> {
  const { client, choice, clip, output } = options;
  const generated = await callTool({
    client,
    name: "generate_asset",
    callId: options.callId,
    input: {
      asset_id: uniqueAssetId({
        base: `clip-${clip.sceneId}`,
        assets: options.assets,
      }),
      capability: "video",
      server: choice.server.server,
      model: choice.model.id,
      input: {
        prompt: options.prompt,
        ...options.values,
        ...sizeInput({ choice, output }),
      },
      first_frame_asset_id: options.firstFrameAssetId,
      ...(options.referenceAssetIds.length === 0
        ? {}
        : { reference_asset_ids: options.referenceAssetIds }),
    },
  });
  if (!generated.ok) return generated;
  const assetId = textField({ data: generated.data, name: "asset_id" });
  const placed = await callTool({
    client,
    name: "place_video",
    input: {
      output_id: output.id,
      asset_id: assetId,
      replace_clip_id: clip.id,
    },
  });
  if (!placed.ok) return placed;
  return {
    ok: true,
    made: {
      assetId,
      sceneClipId: textField({ data: placed.data, name: "scene_clip_id" }),
      startFrame: clip.startFrame,
    },
  };
}
