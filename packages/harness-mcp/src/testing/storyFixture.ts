import { startHarness, type Harness, type ToolCall } from "./harnessFixture.js";
import type { CriticScript } from "./criticFixture.js";

export interface EntryDraft {
  cast_id: string;
  where?: string;
  screen?: "left" | "center" | "right" | "off";
  facing?: "camera" | "away" | "left" | "right";
  state?: string;
  count?: number;
  held_by?: { cast_id: string; hand: "left" | "right" | "both" };
  enters_from?: string;
}

export interface ShotDraft {
  shot_id: string;
  place_id?: string;
  cast_ids?: string[];
  start?: EntryDraft[];
  end?: EntryDraft[];
  action?: string;
  inherits?: string;
  camera_move?: string;
  camera_size?: string;
  camera_angle?: string;
  strikes?: object[];
  music_intensity?: number;
  video_prompt?: string;
}

export function entryOf(draft: EntryDraft) {
  return {
    where: "at the anvil",
    screen: "center",
    facing: "camera",
    state: "the blade is straight",
    ...draft,
  };
}

export function shotOf(draft: ShotDraft) {
  const castIds = draft.cast_ids ?? ["smith"];
  return {
    purpose: `Show ${draft.shot_id}.`,
    action: draft.action ?? "She hammers the red steel and the blade bends",
    place_id: draft.place_id ?? "forge",
    cast_ids: castIds,
    camera_size: draft.camera_size ?? "medium",
    camera_angle: draft.camera_angle ?? "eye-level",
    camera_lens: "normal",
    seconds: 4,
    start_state: (
      draft.start ?? castIds.map((castId) => ({ cast_id: castId }))
    ).map(entryOf),
    end_state: (
      draft.end ??
      castIds.map((castId) => ({ cast_id: castId, state: "the blade is bent" }))
    ).map(entryOf),
    inherits: draft.inherits ?? "The bent blade.",
    shot_id: draft.shot_id,
    music_intensity: draft.music_intensity ?? 2,
    start_picture_prompt: `${draft.shot_id} start`,
    video_prompt: draft.video_prompt ?? `${draft.shot_id} clip`,
    ...(draft.camera_move === undefined
      ? {}
      : { camera_move: draft.camera_move }),
    ...(draft.strikes === undefined ? {} : { strikes: draft.strikes }),
  };
}

export function setPlan(options: {
  harness: Harness;
  shots: ShotDraft[];
}): Promise<ToolCall> {
  return options.harness.call({
    name: "set_story_plan",
    arguments: {
      logline: "A smith forges a blade for her brother.",
      want: "A blade that will not break",
      obstacle: "The steel cracks when it cools",
      change: "She learns to fold the steel",
      shots: options.shots.map(shotOf),
    },
  });
}

export async function passPlan(harness: Harness): Promise<ToolCall> {
  return harness.call({ name: "review_plan" });
}

export async function startStoryHarness(options?: {
  videoStyle?: "graphics" | "ai-video" | "mix";
  critic?: CriticScript | "none";
}): Promise<Harness> {
  const harness = await startHarness(
    options?.critic === undefined ? undefined : { critic: options.critic },
  );
  if (options?.videoStyle !== undefined) {
    await harness.call({
      name: "set_video_style",
      arguments: { video_style: options.videoStyle },
    });
  }
  return harness;
}

export async function makeSheet(options: {
  harness: Harness;
  castId: string;
  kind: "person" | "place" | "prop";
  facts: string[];
}): Promise<void> {
  const { harness, castId } = options;
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: `${castId}-sheet`,
      capability: "image",
      input: { prompt: `${castId} sheet`, width_pixels: 32, height_pixels: 18 },
    },
  });
  await harness.call({
    name: "put_cast_member",
    arguments: {
      cast_id: castId,
      kind: options.kind,
      name: castId.toUpperCase(),
      description: `The ${castId}`,
      facts: options.facts,
      reference_asset_ids: [`${castId}-sheet`],
      sheet_prompts: [`${castId} sheet`],
    },
  });
  if (options.facts.length > 0) {
    await harness.call({
      name: "review_sheet",
      arguments: { cast_id: castId },
    });
  }
}

export async function makeForgeSheets(harness: Harness): Promise<void> {
  await makeSheet({
    harness,
    castId: "forge",
    kind: "place",
    facts: ["The door is on the right wall, hinges on its left edge"],
  });
  await makeSheet({
    harness,
    castId: "smith",
    kind: "person",
    facts: ["The hammer is in her right hand"],
  });
}

export function shotCall(options: {
  harness: Harness;
  assetId: string;
  capability: "image" | "video";
  shotId?: string;
  firstFrameAssetId?: string;
  prompt?: string;
  extra?: Record<string, unknown>;
}): Promise<ToolCall> {
  const isVideo = options.capability === "video";
  const prompt =
    options.prompt ??
    (options.shotId === undefined ? "She strikes" : undefined);
  const promptPart = prompt === undefined ? {} : { prompt };
  return options.harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: options.assetId,
      capability: options.capability,
      input: isVideo
        ? { ...promptPart, duration_seconds: 1 }
        : { ...promptPart, width_pixels: 32, height_pixels: 18 },
      ...(options.shotId === undefined ? {} : { shot_id: options.shotId }),
      ...(options.firstFrameAssetId === undefined
        ? {}
        : { first_frame_asset_id: options.firstFrameAssetId }),
      ...options.extra,
    },
  });
}
