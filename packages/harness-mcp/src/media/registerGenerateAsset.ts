import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { withCast } from "../cast/castRequest.js";
import type { HarnessContext } from "../context.js";
import type { ProgressListener } from "../harness/toolTable.js";
import { failureResult } from "../results.js";
import { withStory } from "../storyPlan/shotRequest.js";
import { findReusableAsset } from "./assetFiles.js";
import {
  generateAssetDescription,
  generateAssetInput,
  toolNameByCapability,
  type GenerateAssetInput,
} from "./generateAssetInput.js";
import { mediaPathInput } from "./mediaPath.js";
import { recordedInputOf, referencePathsInput } from "./referencePaths.js";
import { reuseAsset } from "./reuseAsset.js";
import { cutNoteOf } from "../storyPlan/cutNote.js";
import { longPromptNoteOf } from "../storyPlan/promptAdditions.js";
import { strongReasonOf } from "./strongReason.js";
import { withStrongModel } from "./strongModel.js";
import { talkingVoiceOf } from "./talkingVoice.js";
import { videoInputOf } from "./videoChoices.js";
import { makeAsset } from "./made/makeAsset.js";
import { startMediaCall } from "./runningCall.js";

export async function generateAsset(options: {
  context: HarnessContext;
  request: GenerateAssetInput;
  onProgress: ProgressListener | undefined;
  quotaServers?: Set<string>;
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
  const started = startMediaCall({
    context,
    request,
    voiceSeconds: voice.value?.seconds,
  });
  if (!started.ok) return failureResult(started.failure);
  try {
    return await makeAsset({
      context,
      request,
      snapshot,
      sent: { ...sentInput.value, ...paths.value, ...mediaPath.value },
      voice: voice.value,
      tool,
      input,
      notes: [
        strong.note,
        longPromptNoteOf(request),
        cutNoteOf({ snapshot, request }),
      ],
      ticket: started.value,
      onProgress,
      quotaServers: options.quotaServers,
    });
  } finally {
    started.value.finish();
  }
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
