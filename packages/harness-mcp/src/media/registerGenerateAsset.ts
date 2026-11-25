import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { HarnessContext } from "../context.js";
import type { ProgressListener } from "../harness/toolTable.js";
import { failureResult } from "../results.js";
import { assetFilesFolder, findReusableAsset } from "./assetFiles.js";
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
import { withChosenPictures } from "../storyPlan/designGate.js";
import { kitSheetRecordOf } from "../storyPlan/kitSheets.js";
import { lessonsForYouOf } from "../storyPlan/lessonsForYou.js";
import { callFactsOf, withCallFacts } from "./callFacts.js";
import { prepareCall } from "./preparedCall.js";
import { longPromptNoteOf } from "./promptParts.js";
import { talkingVoiceOf } from "./talkingVoice.js";
import { makeAsset } from "./made/makeAsset.js";
import { startMediaCall } from "./runningCall.js";
import { videoLimitKind } from "./videoLimit.js";

export async function generateAsset(options: {
  context: HarnessContext;
  request: GenerateAssetInput;
  onProgress: ProgressListener | undefined;
  quotaServers?: Set<string>;
}): Promise<CallToolResult> {
  const { context, onProgress } = options;
  const chosen = withChosenPictures({
    snapshot: context.store.read(),
    request: options.request,
  });
  if (chosen.edits.length > 0) {
    const stored = await context.store.applyEdits(chosen.edits);
    if (!stored.ok) {
      return failureResult({
        kind: stored.failure.kind,
        message: stored.failure.message,
        hint: "The choice of the person was not stored. Call again.",
      });
    }
  }
  const snapshot = context.store.read();
  const prepared = await prepareCall({
    context,
    snapshot,
    request: options.request,
  });
  if (!prepared.ok) return failureResult(prepared.failure);
  const { request, prompt } = prepared.value;
  const facts = callFactsOf({
    prompt,
    lessons: lessonsForYouOf({ snapshot, request }),
  });
  const withFacts = (result: CallToolResult) =>
    withCallFacts({ result, facts });
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
    kitSheet: kitSheetRecordOf({ plan: snapshot.bible.storyPlan, request }),
    keyPicture: request.key_picture,
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
  if (existing) {
    return withFacts(
      await reuseAsset({ context, existing, assetId: request.asset_id }),
    );
  }
  if (snapshot.assets.some((asset) => asset.id === request.asset_id)) {
    return failureResult({
      kind: "id-in-use",
      message: `The asset "${request.asset_id}" already exists with another source.`,
      hint: "Choose another asset_id. Call list_assets to see the ids in use.",
    });
  }
  const mediaRequest = {
    capability: request.capability,
    ...(request.server === undefined ? {} : { server: request.server }),
    ...(request.model === undefined ? {} : { model: request.model }),
    input: { ...prepared.value.sentInput, ...paths.value, ...mediaPath.value },
    outputDirectory: assetFilesFolder(projectFolder),
    fileStem: request.asset_id,
    ...(request.shot_id === undefined
      ? {}
      : { about: { shotId: request.shot_id } }),
  };
  const started = startMediaCall({
    context,
    request,
    voiceSeconds: voice.value?.seconds,
  });
  if (!started.ok) {
    if (started.failure.kind === videoLimitKind) {
      await context.mediaTools.recordRefusal({
        request: mediaRequest,
        failure: started.failure,
      });
    }
    return failureResult(started.failure);
  }
  try {
    return withFacts(
      await makeAsset({
        context,
        request,
        snapshot,
        mediaRequest,
        voice: voice.value,
        tool,
        input,
        notes: [
          prepared.value.strongNote,
          longPromptNoteOf({ request, prompt }),
          cutNoteOf({ snapshot, request }),
        ],
        ticket: started.value,
        onProgress,
        quotaServers: options.quotaServers,
      }),
    );
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
