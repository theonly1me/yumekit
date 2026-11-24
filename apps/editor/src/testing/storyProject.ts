import type { RunningEngine } from "./runEngine.js";

const forgeShot = {
  shot_id: "strike",
  purpose: "Show that the steel can bend.",
  action: "She strikes the red steel and the blade bends",
  place_id: "forge",
  cast_ids: ["smith"],
  camera_size: "medium",
  camera_angle: "low",
  camera_move: "push-in",
  seconds: 4,
  start_state:
    "The straight blade glows on the anvil. The hammer is in her right hand.",
  end_state: "The blade is bent on the anvil.",
  inherits: "The bent blade.",
};

async function sheet(options: {
  engine: RunningEngine;
  castId: string;
  kind: string;
  name: string;
  facts: string[];
}): Promise<void> {
  const { engine, castId } = options;
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: `${castId}-sheet`,
      capability: "image",
      input: { prompt: options.name, width_pixels: 64, height_pixels: 36 },
    },
  });
  await engine.callTool({
    name: "put_cast_member",
    input: {
      cast_id: castId,
      kind: options.kind,
      name: options.name,
      description: options.name,
      facts: options.facts,
      reference_asset_ids: [`${castId}-sheet`],
    },
  });
}

export async function buildStoryProject(engine: RunningEngine): Promise<void> {
  await engine.callTool({
    name: "set_video_style",
    input: { video_style: "ai-video" },
  });
  await sheet({
    engine,
    castId: "forge",
    kind: "place",
    name: "The forge",
    facts: ["The door is on the right wall"],
  });
  await sheet({
    engine,
    castId: "smith",
    kind: "person",
    name: "Aiko",
    facts: ["The hammer is in her right hand"],
  });
  await engine.callTool({
    name: "set_story_plan",
    input: {
      logline: "A young smith forges a blade that will not break.",
      want: "A blade for her brother",
      obstacle: "The steel cracks when it cools",
      change: "She folds the steel and it holds",
      shots: [
        forgeShot,
        {
          ...forgeShot,
          shot_id: "quench",
          purpose: "Show the test of the blade.",
          action: "She plunges the bent blade into the water and steam rises",
          start_state: "The blade is bent on the anvil.",
          end_state: "The blade cools in the water barrel.",
          inherits: "",
        },
      ],
    },
  });
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "strike-start",
      capability: "image",
      shot_id: "strike",
      input: { prompt: "The anvil", width_pixels: 64, height_pixels: 36 },
    },
  });
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "strike-clip",
      capability: "video",
      shot_id: "strike",
      first_frame_asset_id: "strike-start",
      input: { prompt: "She strikes", duration_seconds: 1 },
    },
  });
  await engine.callTool({
    name: "review_clip",
    input: { asset_id: "strike-clip", shot_id: "strike" },
  });
  await engine.callTool({
    name: "review_clip",
    input: {
      asset_id: "strike-clip",
      shot_id: "strike",
      verdict: "cut",
      faults: ["The hammer changes hands at 0.8 seconds"],
      keep_from_seconds: 0,
      keep_to_seconds: 0.5,
    },
  });
}
