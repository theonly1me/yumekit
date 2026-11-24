import type { Snapshot } from "../../engine/snapshot.js";
import {
  musicStyleRequest,
  type ExactRequest,
} from "../../lead/exactRequests.js";
import { musicTracksOf } from "../../sound/soundRowFacts.js";
import type { MediaServers } from "../../tools/mediaServers.js";
import { lengthWithoutTrack } from "../sound/soundTimelines.js";
import { musicFactsOf } from "./musicFacts.js";

export const localMusicServer = "local-music";
const largestSeed = 999_999;

export interface MusicStyle {
  choice: string;
  label: string;
  line: string;
  approved: boolean;
}

export interface LocalMusicPick {
  style: string;
  seed: number;
}

export function musicStylesOf(servers: MediaServers): MusicStyle[] {
  const server = servers.servers.find(
    (candidate) =>
      candidate.server === localMusicServer &&
      candidate.capabilities.includes("music"),
  );
  const setting = server?.models
    .find((model) => model.capability === "music")
    ?.settings.find((candidate) => candidate.name === "style");
  if (setting?.kind !== "choice") return [];
  return setting.choices.map(
    (choice) =>
      setting.choice_details?.find((detail) => detail.choice === choice) ?? {
        choice,
        label: choice,
        line: "",
        approved: true,
      },
  );
}

export function videoSecondsOf(snapshot: Snapshot): number {
  const frames = Math.max(
    0,
    ...snapshot.timelines.map((timeline) =>
      lengthWithoutTrack({
        timeline,
        trackId: musicTracksOf({ timeline, assets: snapshot.assets })[0]?.id,
      }),
    ),
  );
  return frames / snapshot.project.framesPerSecond;
}

export function localMusicPickOf(
  snapshot: Snapshot,
): LocalMusicPick | undefined {
  const { asset } = musicFactsOf(snapshot);
  if (asset?.source.kind !== "tool") return undefined;
  if (asset.source.server !== localMusicServer) return undefined;
  const { style, seed } = asset.source.input;
  return typeof style === "string" && typeof seed === "number"
    ? { style, seed }
    : undefined;
}

export function newSeedOf(previous: number | undefined): number {
  const [random = 0] = crypto.getRandomValues(new Uint32Array(1));
  const seed = (random % largestSeed) + 1;
  return seed === previous ? (seed % largestSeed) + 1 : seed;
}

function freeAssetIdOf(options: { snapshot: Snapshot; style: string }): string {
  const taken = new Set(options.snapshot.assets.map((asset) => asset.id));
  const base = `music-${options.style}`;
  let id = base;
  for (let number = 2; taken.has(id); number += 1) {
    id = `${base}-${String(number)}`;
  }
  return id;
}

export function musicRequestOf(options: {
  snapshot: Snapshot;
  style: MusicStyle;
  seed: number;
}): { assetId: string; request: ExactRequest } {
  const { snapshot, style } = options;
  const assetId = freeAssetIdOf({ snapshot, style: style.choice });
  return {
    assetId,
    request: musicStyleRequest({
      styleLabel: style.label,
      seed: options.seed,
      steps: [
        {
          tool: "generate_asset",
          input: {
            asset_id: assetId,
            capability: "music",
            server: localMusicServer,
            input: {
              prompt: `${style.label} music`,
              style: style.choice,
              seed: options.seed,
              duration_seconds: videoSecondsOf(snapshot),
            },
          },
        },
        { tool: "replace_music", input: { asset_id: assetId } },
      ],
    }),
  };
}

export function isMusicInUse(options: {
  snapshot: Snapshot;
  assetId: string;
}): boolean {
  return musicFactsOf(options.snapshot).asset?.id === options.assetId;
}
