import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Edit } from "@yumekit/project";
import { applyEditsResult } from "../applyEditsResult.js";
import { withCast } from "../cast/castRequest.js";
import type { HarnessContext } from "../context.js";
import type { ProgressListener } from "../harness/toolTable.js";
import { failureResult } from "../results.js";
import {
  assetFilesFolder,
  findReusableAsset,
  projectFileOf,
  wordsInFrames,
} from "./assetFiles.js";
import {
  generateAssetDescription,
  generateAssetInput,
  toolNameByCapability,
  type GenerateAssetInput,
} from "./generateAssetInput.js";
import { generatedMediaOf } from "./generatedFile.js";
import { mediaFailureOf } from "./mediaFailures.js";
import { recordedInputOf, referencePathsInput } from "./referencePaths.js";
import { reuseAsset, summaryOf } from "./reuseAsset.js";
import { videoLimitFailureOf } from "./videoLimit.js";

async function generateAsset(options: {
  context: HarnessContext;
  request: GenerateAssetInput;
  onProgress: ProgressListener | undefined;
}): Promise<CallToolResult> {
  const { context, onProgress } = options;
  const snapshot = context.store.read();
  const castApplied = await withCast({
    snapshot,
    request: options.request,
    mediaTools: context.mediaTools,
  });
  if (!castApplied.ok) return failureResult(castApplied.failure);
  const request = castApplied.value;
  const projectFolder = context.store.folder;
  const ids = {
    referenceAssetIds: request.reference_asset_ids,
    firstFrameAssetId: request.first_frame_asset_id,
  };
  const paths = referencePathsInput({ snapshot, projectFolder, ids });
  if (!paths.ok) return failureResult(paths.failure);
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
  if (request.capability === "video") {
    const limitFailure = videoLimitFailureOf({
      snapshot,
      input: request.input,
      limitSeconds: context.mediaTools.limits().generatedVideoSeconds,
    });
    if (limitFailure) return failureResult(limitFailure);
  }
  const ran = await context.mediaTools.run({
    capability: request.capability,
    ...(request.server === undefined ? {} : { server: request.server }),
    ...(request.model === undefined ? {} : { model: request.model }),
    input: { ...request.input, ...paths.value },
    outputDirectory: assetFilesFolder(projectFolder),
    fileStem: request.asset_id,
    ...(onProgress === undefined ? {} : { onProgress }),
  });
  if (!ran.ok) return failureResult(mediaFailureOf(ran.failure));
  const { server, model, result } = ran.value;
  const [file] = result.files;
  if (file === undefined) {
    return failureResult({
      kind: "media-tool-invalid-result",
      message: `The media server "${server}" returned no file.`,
      hint: "Call again, or use another server from list_media_tools.",
    });
  }
  const { framesPerSecond } = snapshot.project;
  const media = await generatedMediaOf({ file, server, framesPerSecond });
  if (!media.ok) return failureResult(media.failure);
  const asset = {
    id: request.asset_id,
    kind: file.kind,
    file: projectFileOf({ projectFolder, path: file.path }),
    ...media.value,
    source: {
      kind: "tool" as const,
      server,
      tool,
      ...(model === undefined ? {} : { model }),
      input,
      ...(result.cost_usd === undefined ? {} : { costUsd: result.cost_usd }),
      ...(result.cost_is_estimate === undefined
        ? {}
        : { costIsEstimate: result.cost_is_estimate }),
    },
  };
  const { words } = result;
  const edit: Edit = {
    kind: "addAsset",
    asset,
    ...(words === undefined
      ? {}
      : { words: wordsInFrames({ words, framesPerSecond }) }),
  };
  const { durationFrames } = media.value;
  const lengthText =
    durationFrames === undefined
      ? ""
      : `, ${String(durationFrames)} frames long`;
  const wordsText =
    words === undefined ? "" : `, with ${String(words.length)} word timings`;
  return applyEditsResult({
    store: context.store,
    edits: [edit],
    line: `Asset "${request.asset_id}" made by ${server}${lengthText}${wordsText}.`,
    data: summaryOf({
      asset: { ...asset, hasWords: words !== undefined },
      reused: false,
    }),
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
