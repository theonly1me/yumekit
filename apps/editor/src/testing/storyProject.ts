import { setScenario } from "./chatTesting.js";
import type { RunningEngine } from "./runEngine.js";
import { criticSteps } from "./storyCritic.js";

function smithState(state: string) {
  return [
    {
      cast_id: "smith",
      where: "at the anvil",
      screen: "center",
      facing: "camera",
      state,
    },
  ];
}

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
  camera_lens: "normal",
  start_state: smithState("the straight blade glows on the anvil"),
  end_state: smithState("the blade is bent on the anvil"),
  inherits: "The bent blade.",
  music_intensity: 3,
  start_picture_prompt: "Aiko at the anvil, the red blade on it",
  video_prompt: "She lifts the hammer and strikes; the blade bends",
};

async function sheet(options: {
  engine: RunningEngine;
  castId: string;
  kind: string;
  name: string;
  facts: string[];
  extra?: Record<string, unknown>;
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
      sheet_prompts: [options.name],
      ...options.extra,
    },
  });
  await engine.callTool({ name: "review_sheet", input: { cast_id: castId } });
}

export async function buildStoryProject(engine: RunningEngine): Promise<void> {
  await setScenario({ engine, scenario: { steps: [], criticSteps } });
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
    extra: {
      brief_facts: ["She swings the hammer with her right hand"],
      restrictions: ["Never show both of her hands close up"],
    },
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
          start_state: smithState("the blade is bent on the anvil"),
          end_state: smithState("the blade cools in the water barrel"),
          inherits: "",
        },
      ],
    },
  });
  await engine.callTool({ name: "review_plan", input: {} });
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "strike-start",
      capability: "image",
      shot_id: "strike",
      input: { width_pixels: 64, height_pixels: 36 },
    },
  });
  await engine.callTool({
    name: "review_start",
    input: { asset_id: "strike-start", shot_id: "strike" },
  });
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "strike-clip",
      capability: "video",
      shot_id: "strike",
      input: { duration_seconds: 1 },
    },
  });
  await engine.callTool({
    name: "review_clip",
    input: { asset_id: "strike-clip", shot_id: "strike" },
  });
  await engine.callTool({
    name: "record_lesson",
    input: {
      lesson: "Keep the hammer in her right hand in every prompt",
      cause: "The hammer changed hands in the first clip",
      shot_id: "strike",
    },
  });
}
