import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Edit } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput, jsonObjectInput } from "../inputs.js";
import { failureResult } from "../results.js";
import {
  assetFilesFolder,
  findReusableAsset,
  framesOfSeconds,
  projectFileOf,
  wordsInFrames,
} from "./assetFiles.js";
import { mediaFailureOf } from "./mediaFailures.js";
import { recordedInputOf, referencePathsInput } from "./referencePaths.js";
import { reuseAsset, summaryOf } from "./reuseAsset.js";

const toolNameByCapability = {
  image: "generate_image",
  speech: "generate_speech",
  music: "generate_music",
  video: "generate_video",
} as const;

const generateAssetInput = {
  asset_id: idInput(
    "The id of the new asset, for example 'narration-intro' or 'hero-image'.",
  ),
  capability: z
    .enum(["image", "speech", "music", "video"])
    .describe(
      "What to make. list_media_tools shows which server has which capability.",
    ),
  server: z
    .string()
    .optional()
    .describe(
      "The media server from list_media_tools. Leave it out to use the default server of the capability.",
    ),
  input: jsonObjectInput.describe(
    "The input of the media tool, with snake_case names and time in seconds. image: prompt (required), width_pixels, height_pixels, transparent_background. speech: text (required), voice, instructions, speed. music: prompt and duration_seconds (both required). video: prompt and duration_seconds (both required), width_pixels, height_pixels. The harness adds output_directory and file_stem. Give reference images and a first frame as asset ids in the fields below, not as paths.",
  ),
  reference_asset_ids: z
    .array(z.string())
    .optional()
    .describe(
      "Image asset ids for the image tool to follow, for example a character sheet. The harness gives the tool their file paths as reference_image_paths.",
    ),
  first_frame_asset_id: z
    .string()
    .optional()
    .describe(
      "An image asset id for the first frame of a video. The harness gives the tool its file path as first_frame_path.",
    ),
};

type GenerateAssetInput = z.infer<z.ZodObject<typeof generateAssetInput>>;

async function generateAsset(options: {
  context: HarnessContext;
  request: GenerateAssetInput;
}): Promise<CallToolResult> {
  const { context, request } = options;
  const snapshot = context.store.read();
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
  const ran = await context.mediaTools.run({
    capability: request.capability,
    ...(request.server === undefined ? {} : { server: request.server }),
    input: { ...request.input, ...paths.value },
    outputDirectory: assetFilesFolder(projectFolder),
    fileStem: request.asset_id,
  });
  if (!ran.ok) return failureResult(mediaFailureOf(ran.failure));
  const { server, result } = ran.value;
  const [file] = result.files;
  if (file === undefined) {
    return failureResult({
      kind: "media-tool-invalid-result",
      message: `The media server "${server}" returned no file.`,
      hint: "Call again, or use another server from list_media_tools.",
    });
  }
  const { framesPerSecond } = snapshot.project;
  const durationFrames =
    file.duration_seconds === undefined
      ? undefined
      : framesOfSeconds({ seconds: file.duration_seconds, framesPerSecond });
  const asset = {
    id: request.asset_id,
    kind: file.kind,
    file: projectFileOf({ projectFolder, path: file.path }),
    ...(file.width_pixels === undefined
      ? {}
      : { widthPixels: file.width_pixels }),
    ...(file.height_pixels === undefined
      ? {}
      : { heightPixels: file.height_pixels }),
    ...(durationFrames === undefined ? {} : { durationFrames }),
    source: {
      kind: "tool" as const,
      server,
      tool,
      input,
      ...(result.cost_usd === undefined ? {} : { costUsd: result.cost_usd }),
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
  context.server.registerTool(
    "generate_asset",
    {
      description:
        "Make an image, speech, music, or video file with a media tool and add it as an asset. Speech gets word timings when the tool gives them; read them with get_asset_words. The same capability, server, and input reuse the earlier file and do not call the tool again. The result gives duration_frames for audio and video.",
      inputSchema: generateAssetInput,
    },
    (request) => generateAsset({ context, request }),
  );
}
