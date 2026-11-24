import { startHarness, type Harness, type ToolCall } from "./harnessFixture.js";

export interface ShotDraft {
  shot_id: string;
  place_id?: string;
  cast_ids?: string[];
  start_state?: string;
  end_state?: string;
  action?: string;
  inherits?: string;
  camera_move?: string;
}

export function shotOf(draft: ShotDraft) {
  return {
    purpose: `Show ${draft.shot_id}.`,
    action: draft.action ?? "She strikes the red steel and the blade bends",
    place_id: draft.place_id ?? "forge",
    cast_ids: draft.cast_ids ?? ["smith"],
    camera_size: "medium",
    camera_angle: "eye-level",
    seconds: 4,
    start_state: draft.start_state ?? "The blade is straight on the anvil.",
    end_state: draft.end_state ?? "The blade is bent on the anvil.",
    inherits: draft.inherits ?? "The bent blade.",
    shot_id: draft.shot_id,
    ...(draft.camera_move === undefined
      ? {}
      : { camera_move: draft.camera_move }),
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

export async function startStoryHarness(options?: {
  videoStyle?: "graphics" | "ai-video" | "mix";
}): Promise<Harness> {
  const harness = await startHarness();
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
    },
  });
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
}): Promise<ToolCall> {
  const isVideo = options.capability === "video";
  return options.harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: options.assetId,
      capability: options.capability,
      input: isVideo
        ? { prompt: "She strikes", duration_seconds: 1 }
        : { prompt: "She strikes", width_pixels: 32, height_pixels: 18 },
      ...(options.shotId === undefined ? {} : { shot_id: options.shotId }),
      ...(options.firstFrameAssetId === undefined
        ? {}
        : { first_frame_asset_id: options.firstFrameAssetId }),
    },
  });
}
