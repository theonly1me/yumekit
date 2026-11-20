import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { findAsset } from "../lookups.js";
import { failureResult, successResult } from "../results.js";
import { wireAssetOf } from "../wireRecords.js";

const readOnly = { readOnlyHint: true } as const;

function registerListAssets(context: HarnessContext): void {
  context.server.registerTool(
    "list_assets",
    {
      description:
        "List the asset records: id, kind, file, size, duration_frames, has_words, has_audio for a video, and the source. Word timings are not included; read them with get_asset_words.",
      inputSchema: {
        kind: z
          .enum(["image", "audio", "video", "font"])
          .optional()
          .describe("Only list assets of this kind."),
      },
      annotations: readOnly,
    },
    ({ kind }) => {
      const assets = context.store
        .read()
        .assets.filter((asset) => kind === undefined || asset.kind === kind)
        .map(wireAssetOf);
      return successResult({
        line: `${String(assets.length)} assets.`,
        data: { assets },
      });
    },
  );
}

function registerGetAssetWords(context: HarnessContext): void {
  context.server.registerTool(
    "get_asset_words",
    {
      description:
        "Read the word timings of a speech asset, in frames from the start of the asset. Use them to set the length of each scene.",
      inputSchema: { asset_id: idInput("The id of the speech asset.") },
      annotations: readOnly,
    },
    async ({ asset_id }) => {
      const found = findAsset({
        snapshot: context.store.read(),
        assetId: asset_id,
      });
      if (!found.ok) return failureResult(found.failure);
      const read = await context.store.readAssetWords(asset_id);
      if (!read.ok) {
        return failureResult({
          kind: "asset-has-no-words",
          message: `The asset "${asset_id}" has no word timings.`,
          hint: `Call align_words with asset_id "${asset_id}" and the text that the audio speaks.`,
        });
      }
      const words = read.value.words.map((word) => ({
        text: word.text,
        start_frame: word.startFrame,
        end_frame: word.endFrame,
      }));
      return successResult({
        line: `${String(words.length)} words in "${asset_id}".`,
        data: {
          asset_id,
          duration_frames: found.value.durationFrames ?? 0,
          words,
        },
      });
    },
  );
}

export function registerAssetReadTools(context: HarnessContext): void {
  registerListAssets(context);
  registerGetAssetWords(context);
}
