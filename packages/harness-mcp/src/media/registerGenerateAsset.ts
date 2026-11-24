import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { withCast } from "../cast/castRequest.js";
import type { HarnessContext } from "../context.js";
import type { ProgressListener } from "../harness/toolTable.js";
import { failureResult } from "../results.js";
import { withStory } from "../storyPlan/shotRequest.js";
import { assetFilesFolder, findReusableAsset } from "./assetFiles.js";
import {
  generateAssetDescription,
  generateAssetInput,
  toolNameByCapability,
  type GenerateAssetInput,
} from "./generateAssetInput.js";
import { addMadeAsset } from "./made/addMadeAsset.js";
import { mediaPathInput } from "./mediaPath.js";
import { mediaFailureOf } from "./mediaFailures.js";
import { recordedInputOf, referencePathsInput } from "./referencePaths.js";
import { reuseAsset } from "./reuseAsset.js";
import { longPromptNoteOf } from "../storyPlan/promptAdditions.js";
import { strongReasonOf } from "./strongReason.js";
import { withStrongModel } from "./strongModel.js";
import { talkingVoiceOf, voicePathInput } from "./talkingVoice.js";
import { videoInputOf } from "./videoChoices.js";
import { roundedSeconds, videoLimitFailureOf } from "./videoLimit.js";

export async function generateAsset(options: {
  context: HarnessContext;
  request: GenerateAssetInput;
  onProgress: ProgressListener | undefined;
}): Promise<CallToolResult> {
  const { context, onProgress } = options;
  const snapshot = context.store.read();
  const storied = withStory({ snapshot, request: options.request });
  if (!storied.ok) return failureResult(storied.failure);
  const why = strongReasonOf({ snapshot, request: storied.value });
  const strong =
    why === undefined
      ? { request: storied.value, note: undefined }
      : await withStrongModel({
          request: storied.value,
          mediaTools: context.mediaTools,
          why,
        });
  const castApplied = await withCast({
    snapshot,
    request: strong.request,
    mediaTools: context.mediaTools,
  });
  if (!castApplied.ok) return failureResult(castApplied.failure);
  const request = castApplied.value;
  const sentInput = await videoInputOf({
    request,
    mediaTools: context.mediaTools,
  });
  if (!sentInput.ok) return failureResult(sentInput.failure);
  const projectFolder = context.store.folder;
  const ids = {
    referenceAssetIds: request.reference_asset_ids,
    firstFrameAssetId: request.first_frame_asset_id,
    lastFrameAssetId: request.last_frame_asset_id,
    cameraMoveId: request.camera_move,
    mediaAssetId: request.media_asset_id,
    voiceAssetId: request.voice_asset_id,
    voicePart: request.voice_part,
    shotId: request.shot_id,
    sheetOf: request.sheet_of,
    simplerForm: request.simpler_form,
  };
  const paths = referencePathsInput({ snapshot, projectFolder, ids });
  if (!paths.ok) return failureResult(paths.failure);
  const mediaPath = mediaPathInput({ snapshot, projectFolder, request });
  if (!mediaPath.ok) return failureResult(mediaPath.failure);
  const voice = talkingVoiceOf({ snapshot, projectFolder, request });
  if (!voice.ok) return failureResult(voice.failure);
  const tool = toolNameByCapability[request.capability];
  const input = recordedInputOf({ input: request.input, ids });
  const existing = findReusableAsset({
    assets: snapshot.assets,
    server: request.server,
    model: request.model,
    tool,
    input,
  });
  if (existing)
    return reuseAsset({ context, existing, assetId: request.asset_id });
  if (snapshot.assets.some((asset) => asset.id === request.asset_id)) {
    return failureResult({
      kind: "id-in-use",
      message: `The asset "${request.asset_id}" already exists with another source.`,
      hint: "Choose another asset_id. Call list_assets to see the ids in use.",
    });
  }
  if (request.capability === "video" || voice.value !== undefined) {
    const limitFailure = videoLimitFailureOf({
      snapshot,
      input:
        voice.value === undefined
          ? request.input
          : { duration_seconds: roundedSeconds(voice.value.seconds) },
      limitSeconds: context.mediaTools.limits().generatedVideoSeconds,
    });
    if (limitFailure) return failureResult(limitFailure);
  }
  const voicePath = await voicePathInput({
    voice: voice.value,
    projectFolder,
    assetId: request.asset_id,
  });
  if (!voicePath.ok) return failureResult(voicePath.failure);
  const ran = await context.mediaTools.run({
    capability: request.capability,
    ...(request.server === undefined ? {} : { server: request.server }),
    ...(request.model === undefined ? {} : { model: request.model }),
    input: {
      ...sentInput.value,
      ...paths.value,
      ...mediaPath.value,
      ...voicePath.value,
    },
    ...(voice.value === undefined
      ? {}
      : { expectedSeconds: voice.value.seconds }),
    outputDirectory: assetFilesFolder(projectFolder),
    fileStem: request.asset_id,
    ...(onProgress === undefined ? {} : { onProgress }),
  });
  if (!ran.ok) return failureResult(mediaFailureOf(ran.failure));
  return addMadeAsset({
    context,
    request,
    snapshot,
    run: ran.value,
    tool,
    input,
    notes: [strong.note, longPromptNoteOf(request)].filter(
      (note) => note !== undefined,
    ),
  });
}

export function registerGenerateAsset(context: HarnessContext): void {
  context.tools.add({
    name: "generate_asset",
    description: generateAssetDescription,
    inputSchema: generateAssetInput,
    run: ({ input: request, onProgress }) =>
      generateAsset({ context, request, onProgress }),
  });
}
