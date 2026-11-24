import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { findAsset } from "../lookups.js";
import { failureResult } from "../results.js";
import {
  assetMarkOf,
  markNameInput,
  regionInput,
  secondsInput,
  wireMarkOf,
} from "./markInputs.js";

const markAssetInput = {
  asset_id: idInput("The id of the video or image asset to mark."),
  name: markNameInput,
  region: regionInput.optional(),
  seconds: secondsInput.optional(),
  remove: z
    .boolean()
    .optional()
    .describe("true removes the mark with this name. Default false."),
};

type MarkAssetInput = z.infer<z.ZodObject<typeof markAssetInput>>;

async function markAsset(options: {
  context: HarnessContext;
  input: MarkAssetInput;
}): Promise<CallToolResult> {
  const { context, input } = options;
  const found = findAsset({
    snapshot: context.store.read(),
    assetId: input.asset_id,
  });
  if (!found.ok) return failureResult(found.failure);
  const others = (found.value.marks ?? []).filter(
    (mark) => mark.name !== input.name,
  );
  const isRemoval = input.remove === true;
  if (!isRemoval && input.region === undefined && input.seconds === undefined) {
    return failureResult({
      kind: "mark-is-empty",
      message: `The mark "${input.name}" has no region and no time.`,
      hint: "Give region, seconds, or both. To remove a mark, give remove true.",
    });
  }
  const marks = isRemoval ? others : [...others, assetMarkOf(input)];
  return applyEditsResult({
    store: context.store,
    edits: [{ kind: "setAssetMarks", assetId: input.asset_id, marks }],
    line: isRemoval
      ? `Mark "${input.name}" removed from asset "${input.asset_id}".`
      : `Mark "${input.name}" saved on asset "${input.asset_id}".`,
    data: { asset_id: input.asset_id, marks: marks.map(wireMarkOf) },
    hints: {
      "invalid-value":
        "A mark belongs to a video or an image asset. A region stays inside the picture: x + width and y + height are at most 1.",
    },
  });
}

export function registerMarkAsset(context: HarnessContext): void {
  context.tools.add({
    name: "mark_asset",
    description:
      "Name a part or a moment of a video or image asset, for example the prompt box of a screen recording at 2.5 seconds. A mark with the same name replaces the old one. The footage kit scene takes the name as mark in place of region and startSeconds, and look-swap takes it in marks. Look at the asset with preview_assets first to find the region and the time: it shows the frames with their times, and a region to look closer.",
    inputSchema: markAssetInput,
    run: ({ input }) => markAsset({ context, input }),
  });
}
