import { copyFile, rm } from "node:fs/promises";
import { basename, extname, isAbsolute, join } from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { failureResult } from "../results.js";
import { assetFilesFolder, projectFileOf } from "./assetFiles.js";
import { extensionsByKind, importedMediaOf } from "./importedMedia.js";

const importAssetInput = {
  asset_id: idInput("The id of the new asset."),
  kind: z
    .enum(["image", "font", "audio", "video"])
    .describe(
      "The kind of the file. The harness reads the size of an image and the length of audio and video.",
    ),
  source_path: z
    .string()
    .describe(
      "The absolute path of a file on this machine that the user gave you.",
    ),
  original_name: z
    .string()
    .min(1)
    .max(200)
    .optional()
    .describe(
      "The name of the file that the person knows, to show and to download under. By default the last part of source_path.",
    ),
};

type ImportAssetInput = z.infer<z.ZodObject<typeof importAssetInput>>;

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function importAsset(options: {
  context: HarnessContext;
  request: ImportAssetInput;
}): Promise<CallToolResult> {
  const { context, request } = options;
  const extension = extname(request.source_path).toLowerCase();
  const permitted: readonly string[] = extensionsByKind[request.kind];
  if (!permitted.includes(extension)) {
    return failureResult({
      kind: "file-type-not-supported",
      message: `A ${request.kind} asset cannot have the extension "${extension}".`,
      hint: `Give a file with one of these extensions: ${permitted.join(", ")}.`,
    });
  }
  if (!isAbsolute(request.source_path)) {
    return failureResult({
      kind: "source-path-not-absolute",
      message: `"${request.source_path}" is not an absolute path.`,
      hint: "Give the full path of the file, for example /Users/name/Pictures/logo.png.",
    });
  }
  if (
    context.store.read().assets.some((asset) => asset.id === request.asset_id)
  ) {
    return failureResult({
      kind: "id-in-use",
      message: `The asset "${request.asset_id}" already exists.`,
      hint: "Choose another asset_id. Call list_assets to see the ids in use.",
    });
  }
  const destination = join(
    assetFilesFolder(context.store.folder),
    `${request.asset_id}${extension}`,
  );
  try {
    await copyFile(request.source_path, destination);
  } catch (error) {
    if (!isMissingFile(error)) throw error;
    return failureResult({
      kind: "source-not-found",
      message: `The file "${request.source_path}" does not exist.`,
      hint: "Check the path with the user, then call import_asset again.",
    });
  }
  const originalName = request.original_name ?? basename(request.source_path);
  const imported = await importedMediaOf({
    file: destination,
    extension,
    kind: request.kind,
    framesPerSecond: context.store.read().project.framesPerSecond,
  });
  if (!imported.ok) {
    await rm(destination, { force: true });
    return failureResult(imported.failure);
  }
  return applyEditsResult({
    store: context.store,
    edits: [
      {
        kind: "addAsset",
        asset: {
          id: request.asset_id,
          kind: request.kind,
          file: projectFileOf({
            projectFolder: context.store.folder,
            path: destination,
          }),
          ...imported.value,
          source: {
            kind: "import",
            originalName,
          },
        },
      },
    ],
    line: `File "${originalName}" imported as asset "${request.asset_id}".`,
    data: {
      asset_id: request.asset_id,
      kind: request.kind,
      ...(imported.value.durationFrames === undefined
        ? {}
        : { duration_frames: imported.value.durationFrames }),
    },
  });
}

export function registerImportAsset(context: HarnessContext): void {
  context.tools.add({
    name: "import_asset",
    description:
      "Copy an image, audio, video, or font file of the user into the project and add it as an asset. Use the asset id in scene props, for example assetId of image-pan. The result gives duration_frames for audio and video.",
    inputSchema: importAssetInput,
    run: ({ input: request }) => importAsset({ context, request }),
  });
}
