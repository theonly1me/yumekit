import { cameraMoveCatalog } from "@yumekit/project/camera-moves";
import type { Asset, Output, SceneClip, Snapshot } from "../engine/snapshot.js";
import {
  stillRequest,
  videoClipRequest,
  type ExactRequest,
  type ToolStep,
} from "../lead/exactRequests.js";
import { assetNameOf } from "../names/index.js";
import type { ModelChoice } from "./modelChoices.js";
import { secondsOf, type SettingValues } from "./settingValues.js";
import { uniqueAssetId, type ToolFailure } from "./toolCalls.js";

export interface MadeClip {
  assetId: string;
  sceneClipId: string;
  startFrame: number;
  outputs: Output[];
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

export function stillRequestOf(options: {
  choice: ModelChoice;
  prompt: string;
  output: Output;
  assets: Asset[];
  sceneId: string;
  aboutClipId: string | undefined;
}): { assetId: string; request: ExactRequest } {
  const { choice } = options;
  const assetId = uniqueAssetId({
    base: `still-${options.sceneId}`,
    assets: options.assets,
  });
  return {
    assetId,
    request: stillRequest({
      modelLabel: choice.model.label,
      prompt: options.prompt,
      aboutClipId: options.aboutClipId,
      steps: [
        {
          tool: "generate_asset",
          input: {
            asset_id: assetId,
            capability: "image",
            server: choice.server.server,
            model: choice.model.id,
            input: { prompt: options.prompt, ...sizeInput(options) },
          },
        },
      ],
    }),
  };
}

export function placeSteps(options: {
  assetId: string;
  clipId: string;
  outputs: Output[];
  extra?: Record<string, unknown>;
}): ToolStep[] {
  return options.outputs.map((output) => ({
    tool: "place_video",
    input: {
      output_id: output.id,
      asset_id: options.assetId,
      replace_clip_id: options.clipId,
      remove_person_work: true,
      ...options.extra,
    },
  }));
}

function pictureNameOf(options: {
  assets: Asset[];
  assetId: string | undefined;
}): string | undefined {
  if (options.assetId === undefined) return undefined;
  const asset = options.assets.find((each) => each.id === options.assetId);
  return asset === undefined
    ? "the picture of the scene"
    : `the picture "${assetNameOf(asset)}"`;
}

export function clipRequestOf(options: {
  choice: ModelChoice;
  prompt: string;
  values: SettingValues;
  firstFrameAssetId: string | undefined;
  lastFrameAssetId: string | undefined;
  cameraMoveId: string | undefined;
  referenceAssetIds: string[];
  outputs: [Output, ...Output[]];
  clip: SceneClip;
  assets: Asset[];
}): { assetId: string; request: ExactRequest } {
  const { choice, clip, outputs } = options;
  const [output] = outputs;
  const assetId = uniqueAssetId({
    base: `clip-${clip.sceneId}`,
    assets: options.assets,
  });
  const generate: ToolStep = {
    tool: "generate_asset",
    input: {
      asset_id: assetId,
      capability: "video",
      server: choice.server.server,
      model: choice.model.id,
      input: {
        prompt: options.prompt,
        ...options.values,
        ...sizeInput({ choice, output }),
      },
      ...(options.firstFrameAssetId === undefined
        ? {}
        : { first_frame_asset_id: options.firstFrameAssetId }),
      ...(options.lastFrameAssetId === undefined
        ? {}
        : { last_frame_asset_id: options.lastFrameAssetId }),
      ...(options.cameraMoveId === undefined
        ? {}
        : { camera_move: options.cameraMoveId }),
      ...(options.referenceAssetIds.length === 0
        ? {}
        : { reference_asset_ids: options.referenceAssetIds }),
    },
  };
  return {
    assetId,
    request: videoClipRequest({
      modelLabel: choice.model.label,
      seconds: secondsOf(options.values),
      cameraMoveLabel: cameraMoveCatalog.find(
        (move) => move.id === options.cameraMoveId,
      )?.name,
      startPicture: pictureNameOf({
        assets: options.assets,
        assetId: options.firstFrameAssetId,
      }),
      endPicture: pictureNameOf({
        assets: options.assets,
        assetId: options.lastFrameAssetId,
      }),
      aboutClipId: clip.id,
      steps: [generate, ...placeSteps({ assetId, clipId: clip.id, outputs })],
    }),
  };
}

export function madeClipOf(options: {
  snapshot: Snapshot;
  assetId: string;
  clip: SceneClip;
  outputs: Output[];
}): MadeClip | undefined {
  const { snapshot, assetId } = options;
  const sceneId = `video-${assetId}`;
  const placed = snapshot.timelines
    .flatMap((timeline) => timeline.tracks)
    .flatMap((track) => (track.kind === "scene" ? track.clips : []))
    .find((clip) => clip.sceneId === sceneId);
  return placed === undefined
    ? undefined
    : {
        assetId,
        sceneClipId: placed.id,
        startFrame: options.clip.startFrame,
        outputs: options.outputs,
      };
}
