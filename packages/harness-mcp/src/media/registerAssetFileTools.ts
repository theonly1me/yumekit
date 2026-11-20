import { copyFile } from "node:fs/promises";
import { basename, extname, isAbsolute, join } from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { failureResult } from "../results.js";
import { assetFilesFolder, projectFileOf } from "./assetFiles.js";

const extensionsByKind = {
  image: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"],
  font: [".woff2", ".woff", ".ttf", ".otf"],
} as const;

const importAssetInput = {
  asset_id: idInput("The id of the new asset."),
  kind: z
    .enum(["image", "font", "audio", "video"])
    .describe(
      "The kind of the file. In milestone 1, only image and font can be imported.",
    ),
  source_path: z
    .string()
    .describe(
      "The absolute path of a file on this machine that the user gave you.",
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
  if (request.kind === "audio" || request.kind === "video") {
    return failureResult({
      kind: "import-kind-not-supported",
      message: `import_asset cannot import ${request.kind} yet, because the harness cannot measure its length.`,
      hint: 'Make audio with generate_asset and capability "speech" or "music". Import only image and font files.',
    });
  }
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
          source: {
            kind: "import",
            originalName: basename(request.source_path),
          },
        },
      },
    ],
    line: `File "${basename(request.source_path)}" imported as asset "${request.asset_id}".`,
    data: { asset_id: request.asset_id },
  });
}

export function registerImportAsset(context: HarnessContext): void {
  context.server.registerTool(
    "import_asset",
    {
      description:
        "Copy an image or font file of the user into the project and add it as an asset. Use the asset id in scene props, for example assetId of image-pan.",
      inputSchema: importAssetInput,
    },
    (request) => importAsset({ context, request }),
  );
}
