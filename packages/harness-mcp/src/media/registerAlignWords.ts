import { join } from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { findAsset } from "../lookups.js";
import { failureResult } from "../results.js";
import { assetFilesFolder, wordsInFrames } from "./assetFiles.js";
import { mediaFailureOf } from "./mediaFailures.js";

async function alignWords(options: {
  context: HarnessContext;
  assetId: string;
  text: string;
}): Promise<CallToolResult> {
  const { context, assetId, text } = options;
  const snapshot = context.store.read();
  const found = findAsset({ snapshot, assetId });
  if (!found.ok) return failureResult(found.failure);
  const asset = found.value;
  if (asset.kind !== "audio") {
    return failureResult({
      kind: "asset-not-audio",
      message: `The asset "${assetId}" is of kind ${asset.kind}. Only audio has word timings.`,
      hint: "Call list_assets with kind audio and use one of those ids.",
    });
  }
  if (asset.hasWords) {
    return failureResult({
      kind: "asset-has-words",
      message: `The asset "${assetId}" already has word timings.`,
      hint: `Read them with get_asset_words. Make the speech again with generate_asset if the words changed.`,
    });
  }
  const ran = await context.mediaTools.run({
    capability: "align",
    input: { audio_path: join(context.store.folder, asset.file), text },
    outputDirectory: assetFilesFolder(context.store.folder),
    fileStem: assetId,
  });
  if (!ran.ok) return failureResult(mediaFailureOf(ran.failure));
  const { words } = ran.value;
  if (words === undefined) {
    return failureResult({
      kind: "media-tool-invalid-result",
      message: "The align tool returned no word timings.",
      hint: "Use another server with the align capability from list_media_tools, and tell the user.",
    });
  }
  return applyEditsResult({
    store: context.store,
    edits: [
      {
        kind: "setAssetWords",
        assetId,
        words: wordsInFrames({
          words,
          framesPerSecond: snapshot.project.framesPerSecond,
        }),
      },
    ],
    line: `${String(words.length)} word timings stored for "${assetId}".`,
    data: { asset_id: assetId, word_count: words.length },
  });
}

export function registerAlignWords(context: HarnessContext): void {
  context.server.registerTool(
    "align_words",
    {
      description:
        "Make word timings for a speech asset that has none, from the text that it speaks, and store them. Captions and get_asset_words need them.",
      inputSchema: {
        asset_id: idInput("The id of the speech asset."),
        text: z
          .string()
          .min(1)
          .describe("The exact words that the audio speaks."),
      },
    },
    ({ asset_id, text }) => alignWords({ context, assetId: asset_id, text }),
  );
}
