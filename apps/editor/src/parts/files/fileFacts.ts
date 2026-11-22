import type { Asset, Snapshot } from "../../engine/snapshot.js";
import type { MediaServers } from "../../tools/mediaServers.js";
import { clockOf } from "../music/musicFacts.js";
import { yourFileText } from "./YourFile.js";
import { assetUsesIn, soundUseOf, placeLabelsOf } from "./fileUses.js";

export type FileGroupId =
  "pictures" | "videos" | "voice" | "music" | "sounds" | "fonts";

export const fileGroupTitles: Record<FileGroupId, string> = {
  pictures: "Pictures",
  videos: "Video clips",
  voice: "Voice",
  music: "Music",
  sounds: "Sounds",
  fonts: "Fonts",
};

const groupOrder: FileGroupId[] = [
  "pictures",
  "videos",
  "voice",
  "music",
  "sounds",
  "fonts",
];

export interface FileRow {
  asset: Asset;
  name: string;
  sizeText: string;
  madeBy: string;
  uses: string[];
  lengthSeconds: number;
}

export interface FileGroup {
  id: FileGroupId;
  title: string;
  rows: FileRow[];
}

function nameOf(asset: Asset): string {
  if (asset.source.kind === "import") return asset.source.originalName;
  const { prompt, text } = asset.source.input;
  if (typeof prompt === "string" && prompt !== "") return prompt;
  return typeof text === "string" && text !== "" ? text : asset.id;
}

function sizeTextOf(options: { asset: Asset; framesPerSecond: number }) {
  const { asset } = options;
  if (asset.kind === "font") return "Font";
  if (asset.durationFrames !== undefined) {
    return clockOf(asset.durationFrames / options.framesPerSecond);
  }
  const { widthPixels, heightPixels } = asset;
  return widthPixels === undefined || heightPixels === undefined
    ? ""
    : `${String(widthPixels)} x ${String(heightPixels)}`;
}

export function madeByOf(options: {
  asset: Asset;
  servers: MediaServers | undefined;
}): string {
  const { source } = options.asset;
  if (source.kind === "import") return yourFileText;
  const server = options.servers?.servers.find(
    (candidate) => candidate.server === source.server,
  );
  const serverLabel = server?.label ?? source.server;
  if (serverLabel === undefined) return "Made by the AI";
  const modelLabel =
    server?.models.find((model) => model.id === source.model)?.label ??
    source.model;
  return modelLabel === undefined
    ? `Made with ${serverLabel}`
    : `Made with ${serverLabel}, ${modelLabel}`;
}

function soundGroupOf(options: { snapshot: Snapshot; asset: Asset }) {
  const { asset } = options;
  const soundUses = assetUsesIn({
    snapshot: options.snapshot,
    assetId: asset.id,
  }).flatMap((use) =>
    use.kind === "audio-clip"
      ? [soundUseOf({ snapshot: options.snapshot, ...use })]
      : [],
  );
  if (soundUses.includes("voice")) return "voice";
  if (soundUses.includes("music")) return "music";
  if (soundUses.includes("sounds")) return "sounds";
  const tool = asset.source.kind === "tool" ? asset.source.tool : "";
  if (asset.hasWords || tool.includes("speech")) return "voice";
  return tool.includes("music") ? "music" : "sounds";
}

function groupOf(options: { snapshot: Snapshot; asset: Asset }): FileGroupId {
  switch (options.asset.kind) {
    case "image":
      return "pictures";
    case "video":
      return "videos";
    case "font":
      return "fonts";
    case "audio":
      return soundGroupOf(options);
  }
}

export function fileGroupsOf(options: {
  snapshot: Snapshot;
  servers: MediaServers | undefined;
}): FileGroup[] {
  const { snapshot, servers } = options;
  const framesPerSecond = snapshot.project.framesPerSecond;
  const rows = snapshot.assets.map((asset) => ({
    groupId: groupOf({ snapshot, asset }),
    row: {
      asset,
      name: nameOf(asset),
      sizeText: sizeTextOf({ asset, framesPerSecond }),
      madeBy: madeByOf({ asset, servers }),
      uses: placeLabelsOf({
        snapshot,
        uses: assetUsesIn({ snapshot, assetId: asset.id }),
      }),
      lengthSeconds: (asset.durationFrames ?? 0) / framesPerSecond,
    },
  }));
  return groupOrder.flatMap((id) => {
    const groupRows = rows
      .filter((candidate) => candidate.groupId === id)
      .map((candidate) => candidate.row);
    return groupRows.length === 0
      ? []
      : [{ id, title: fileGroupTitles[id], rows: groupRows }];
  });
}
