import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Edit, JsonObject } from "@yumekit/project";
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
import { mediaFailureOf, resolveServer } from "./mediaFailures.js";
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
      "The media server from list_media_tools. Needed only when more than one server has the capability.",
    ),
  input: jsonObjectInput.describe(
    "The input of the media tool, with snake_case names and time in seconds. image: prompt (required), width_pixels, height_pixels, transparent_background. speech: text (required), voice, instructions, speed. music: prompt and duration_seconds (both required). video: prompt and duration_seconds (both required), width_pixels, height_pixels. The harness adds output_directory and file_stem.",
  ),
};

type GenerateAssetInput = z.infer<z.ZodObject<typeof generateAssetInput>>;

async function generateAsset(options: {
  context: HarnessContext;
  request: GenerateAssetInput;
}): Promise<CallToolResult> {
  const { context, request } = options;
  const snapshot = context.store.read();
  const server = resolveServer({
    mediaTools: context.mediaTools,
    capability: request.capability,
    server: request.server,
  });
  if (!server.ok) return failureResult(server.failure);
  const tool = toolNameByCapability[request.capability];
  const input: JsonObject = request.input;
  const existing = findReusableAsset({
    assets: snapshot.assets,
    server: server.value,
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
  const projectFolder = context.store.folder;
  const ran = await context.mediaTools.run({
    capability: request.capability,
    server: server.value,
    input,
    outputDirectory: assetFilesFolder(projectFolder),
    fileStem: request.asset_id,
  });
  if (!ran.ok) return failureResult(mediaFailureOf(ran.failure));
  const [file] = ran.value.files;
  if (file === undefined) {
    return failureResult({
      kind: "media-tool-invalid-result",
      message: `The media server "${server.value}" returned no file.`,
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
      server: server.value,
      tool,
      input,
      ...(ran.value.cost_usd === undefined
        ? {}
        : { costUsd: ran.value.cost_usd }),
    },
  };
  const { words } = ran.value;
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
    line: `Asset "${request.asset_id}" made by ${server.value}${lengthText}${wordsText}.`,
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
