import { join } from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Asset, AssetRegion } from "@yumekit/project";
import type { HarnessContext } from "../context.js";
import { renderFailureOf } from "../output/renderFailures.js";
import type { HarnessFailure, Outcome } from "../results.js";

export type Content = CallToolResult["content"];

export const criticFramesPerSecond = 8;

export const criticSheetSeconds = 1.5;

function rounded(seconds: number): number {
  return Math.round(seconds * 1000) / 1000;
}

export async function pictureOf(options: {
  context: HarnessContext;
  asset: Asset;
  label: string;
  region?: AssetRegion | undefined;
  fromSeconds?: number;
  toSeconds?: number;
  count?: number;
  beside?: { asset: Asset; label: string } | undefined;
}): Promise<Outcome<Content, HarnessFailure>> {
  const { context, asset, beside } = options;
  const kind = asset.kind === "video" ? "video" : "image";
  const sheet = await context.pictures.renderAssetSheet({
    file: join(context.store.folder, asset.file),
    title: options.label,
    kind,
    widthPixels: asset.widthPixels ?? 1,
    heightPixels: asset.heightPixels ?? 1,
    marks: [],
    ...(options.region === undefined ? {} : { region: options.region }),
    ...(options.fromSeconds === undefined
      ? {}
      : { fromSeconds: options.fromSeconds }),
    ...(options.toSeconds === undefined
      ? {}
      : { toSeconds: options.toSeconds }),
    ...(options.count === undefined ? {} : { count: options.count }),
    ...(kind === "video" && (options.count ?? 2) > 1 ? { columns: 4 } : {}),
    ...(beside === undefined
      ? {}
      : {
          beside: {
            file: join(context.store.folder, beside.asset.file),
            title: beside.label,
            widthPixels: beside.asset.widthPixels ?? 1,
            heightPixels: beside.asset.heightPixels ?? 1,
          },
        }),
  });
  if (!sheet.ok) return { ok: false, failure: renderFailureOf(sheet.failure) };
  const times =
    sheet.value.seconds.length === 0
      ? ""
      : ` Frames at ${sheet.value.seconds.map((seconds) => `${String(seconds)}s`).join(", ")}.`;
  return {
    ok: true,
    value: [
      { type: "text", text: `${options.label}.${times}` },
      {
        type: "image",
        data: Buffer.from(sheet.value.picture).toString("base64"),
        mimeType: "image/jpeg",
      },
    ],
  };
}

export function denseWindowsOf(options: {
  fromSeconds: number;
  toSeconds: number;
}): { fromSeconds: number; toSeconds: number; count: number }[] {
  const windows = [];
  for (
    let start = options.fromSeconds;
    start < options.toSeconds - 0.01;
    start += criticSheetSeconds
  ) {
    const end = Math.min(options.toSeconds, start + criticSheetSeconds);
    windows.push({
      fromSeconds: rounded(start),
      toSeconds: rounded(end),
      count: Math.max(1, Math.round((end - start) * criticFramesPerSecond)),
    });
  }
  return windows;
}

export async function joinedContent(
  parts: Promise<Outcome<Content, HarnessFailure>>[],
): Promise<Outcome<Content, HarnessFailure>> {
  const content: Content = [];
  for (const part of await Promise.all(parts)) {
    if (!part.ok) return part;
    content.push(...part.value);
  }
  return { ok: true, value: content };
}
