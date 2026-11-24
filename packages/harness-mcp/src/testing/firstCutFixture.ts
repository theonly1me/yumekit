import type { CriticScript } from "./criticFixture.js";
import type { Harness, ToolCall } from "./harnessFixture.js";
import {
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
  type ShotDraft,
} from "./storyFixture.js";

const entries = {
  forge: { kind: "place", name: "FORGE", description: "The forge" },
  smith: { kind: "person", name: "SMITH", description: "The smith" },
} as const;

export function putEntry(options: {
  harness: Harness;
  castId: "forge" | "smith";
  extra?: Record<string, unknown>;
}): Promise<ToolCall> {
  return options.harness.call({
    name: "put_cast_member",
    arguments: {
      cast_id: options.castId,
      ...entries[options.castId],
      facts: [`The ${options.castId} fact`],
      sheet_prompts: [`${options.castId} sheet`],
      ...options.extra,
    },
  });
}

export async function plannedFilm(options?: {
  critic?: CriticScript;
  shots?: ShotDraft[];
  smithFacts?: string[];
}): Promise<Harness> {
  const harness = await startStoryHarness({
    videoStyle: "ai-video",
    ...(options?.critic === undefined ? {} : { critic: options.critic }),
  });
  await putEntry({ harness, castId: "forge" });
  await putEntry({
    harness,
    castId: "smith",
    ...(options?.smithFacts === undefined
      ? {}
      : { extra: { facts: options.smithFacts } }),
  });
  await setPlan({ harness, shots: options?.shots ?? [{ shot_id: "strike" }] });
  await passPlan(harness);
  return harness;
}

export function sheetTry(options: {
  harness: Harness;
  castId: string;
  assetId: string;
  prompt?: string;
  references?: string[];
  extra?: Record<string, unknown>;
}): Promise<ToolCall> {
  return options.harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: options.assetId,
      capability: "image",
      sheet_of: options.castId,
      input: {
        width_pixels: 32,
        height_pixels: 18,
        ...(options.prompt === undefined ? {} : { prompt: options.prompt }),
      },
      ...(options.references === undefined
        ? {}
        : { reference_asset_ids: options.references }),
      ...options.extra,
    },
  });
}

export async function useSheet(options: {
  harness: Harness;
  castId: "forge" | "smith";
  assetIds: string[];
}): Promise<ToolCall> {
  const { harness, castId } = options;
  await harness.call({
    name: "put_cast_member",
    arguments: {
      cast_id: castId,
      ...entries[castId],
      reference_asset_ids: options.assetIds,
    },
  });
  return harness.call({ name: "review_sheet", arguments: { cast_id: castId } });
}

export async function reviewedStart(options: {
  harness: Harness;
  assetId: string;
  shotId: string;
  extra?: Record<string, unknown>;
}): Promise<ToolCall> {
  const { harness, assetId, shotId } = options;
  const made = await shotCall({
    harness,
    assetId,
    capability: "image",
    shotId,
    ...(options.extra === undefined ? {} : { extra: options.extra }),
  });
  if (made.isError) return made;
  return harness.call({
    name: "review_start",
    arguments: { asset_id: assetId, shot_id: shotId },
  });
}
