import { join } from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { AssetSheet } from "@yumekit/render";
import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { renderFailureOf } from "../output/renderFailures.js";
import { failureResult } from "../results.js";
import { wireMarkOf } from "./markInputs.js";
import {
  plannedLookOf,
  previewAssetsInput,
  type PlannedLook,
} from "./previewAssetsInput.js";

type PreviewAssetsInput = z.infer<z.ZodObject<typeof previewAssetsInput>>;

function lengthSecondsOf(options: {
  look: PlannedLook;
  framesPerSecond: number;
}): number | undefined {
  const { durationFrames } = options.look.asset;
  return durationFrames === undefined
    ? undefined
    : Math.round((durationFrames / options.framesPerSecond) * 100) / 100;
}

function titleOf(options: {
  look: PlannedLook;
  lengthSeconds: number | undefined;
}): string {
  const { asset, region } = options.look;
  const size = `${String(asset.widthPixels ?? 0)}x${String(asset.heightPixels ?? 0)}`;
  const length =
    options.lengthSeconds === undefined
      ? ""
      : `, ${String(options.lengthSeconds)}s`;
  const part =
    region === undefined
      ? ""
      : `, part x ${String(region.x)} y ${String(region.y)} w ${String(region.width)} h ${String(region.height)}`;
  return `${asset.id}: ${asset.kind} ${size}${length}${part}`;
}

function lookLine(options: {
  look: PlannedLook;
  sheet: AssetSheet;
  lengthSeconds: number | undefined;
}): string {
  const { look, sheet } = options;
  const marks = (look.asset.marks ?? []).map((mark) => mark.name);
  const times =
    sheet.seconds.length === 0
      ? "The picture."
      : `Frames at ${sheet.seconds.map((seconds) => `${String(seconds)}s`).join(", ")}, left to right and top to bottom.`;
  const markText =
    marks.length === 0
      ? "No marks."
      : `Marks (dashed boxes): ${marks.join(", ")}.`;
  return `${titleOf(options)}. ${times} ${markText}`;
}

async function previewAssets(options: {
  context: HarnessContext;
  input: PreviewAssetsInput;
}): Promise<CallToolResult> {
  const { context } = options;
  const snapshot = context.store.read();
  const looks: PlannedLook[] = [];
  for (const look of options.input.assets) {
    const planned = plannedLookOf({ assets: snapshot.assets, look });
    if (!planned.ok) return failureResult(planned.failure);
    looks.push(planned.value);
  }
  const { framesPerSecond } = snapshot.project;
  const drawn = await Promise.all(
    looks.map(async (look) => {
      const lengthSeconds = lengthSecondsOf({ look, framesPerSecond });
      const sheet = await context.pictures.renderAssetSheet({
        file: join(context.store.folder, look.asset.file),
        title: titleOf({ look, lengthSeconds }),
        kind: look.kind,
        widthPixels: look.asset.widthPixels ?? 1,
        heightPixels: look.asset.heightPixels ?? 1,
        marks: look.asset.marks ?? [],
        ...(look.region === undefined ? {} : { region: look.region }),
        ...(look.fromSeconds === undefined
          ? {}
          : { fromSeconds: look.fromSeconds }),
        ...(look.toSeconds === undefined ? {} : { toSeconds: look.toSeconds }),
        ...(look.count === undefined ? {} : { count: look.count }),
      });
      return { look, sheet, lengthSeconds };
    }),
  );
  const content: CallToolResult["content"] = [];
  const assets = [];
  for (const { look, sheet, lengthSeconds } of drawn) {
    if (!sheet.ok) return failureResult(renderFailureOf(sheet.failure));
    content.push(
      {
        type: "text",
        text: lookLine({ look, sheet: sheet.value, lengthSeconds }),
      },
      {
        type: "image",
        data: Buffer.from(sheet.value.picture).toString("base64"),
        mimeType: "image/jpeg",
      },
    );
    assets.push({
      asset_id: look.asset.id,
      kind: look.kind,
      width_pixels: look.asset.widthPixels,
      height_pixels: look.asset.heightPixels,
      ...(lengthSeconds === undefined
        ? {}
        : { duration_seconds: lengthSeconds }),
      seconds: sheet.value.seconds,
      marks: (look.asset.marks ?? []).map(wireMarkOf),
    });
  }
  return { content, structuredContent: { assets } };
}

export function registerPreviewAssets(context: HarnessContext): void {
  context.tools.add({
    name: "preview_assets",
    description:
      "Look at video and picture assets before you place them, in one call for all of them. A video gives one picture with 12 frames at even steps, each with its time, and the size, the length, and the marks (dashed boxes). A picture gives the picture. To look closer, give a region, a mark, or from_seconds and to_seconds. Then name the parts with mark_asset, and place them with the footage kit scene. Needs no scene and no timeline.",
    inputSchema: previewAssetsInput,
    annotations: { readOnlyHint: true },
    run: ({ input }) => previewAssets({ context, input }),
  });
}
