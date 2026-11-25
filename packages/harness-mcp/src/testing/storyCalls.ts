import type { ScriptedCall } from "./everyToolCall.js";

export const storyCalls: ScriptedCall[] = [
  {
    name: "generate_asset",
    input: {
      asset_id: "still",
      capability: "image",
      input: { prompt: "a lake", width_pixels: 64, height_pixels: 48 },
    },
  },
  { name: "get_story_guide", input: {} },
  {
    name: "put_cast_member",
    input: {
      cast_id: "lake",
      kind: "place",
      name: "Lake",
      description: "A cold lake",
      facts: ["The pier is on the left bank"],
      reference_asset_ids: ["still"],
      sheet_prompts: ["A cold lake at dawn"],
    },
  },
  { name: "review_sheet", input: { cast_id: "lake" } },
  {
    name: "set_story",
    input: {
      premise: "A thirsty fox crosses a frozen lake to drink.",
      world: "A frozen lake in a dry winter.",
      world_rule: "The ice holds only what is light.",
      characters: [
        {
          character_id: "fox",
          name: "Fox",
          background: "Born by the lake.",
          want: "water",
          fear: "the ice",
          does_not_know: "the ice is thin",
        },
      ],
      opposing_force: {
        force_id: "ice",
        name: "The ice",
        what: "Thin winter ice.",
        why: "It holds only what is light.",
      },
      arc: [
        { step_id: "thirst", step: "The fox is thirsty." },
        { step_id: "crack", step: "The ice cracks." },
        { step_id: "drink", step: "The fox drinks." },
      ],
      unknown_at_end: "Whether the ice holds the fox.",
    },
  },
  {
    name: "set_story_plan",
    input: {
      logline: "A fox finds a lake and drinks.",
      want: "Water",
      obstacle: "Thin ice",
      change: "The ice breaks under its paw",
      shots: [
        {
          shot_id: "dawn",
          purpose: "The fox reaches the water.",
          action: "The fox taps the ice with its paw and the ice cracks",
          place_id: "lake",
          cast_ids: [],
          camera_size: "medium",
          camera_angle: "low",
          camera_lens: "normal",
          seconds: 2,
          start_state: [],
          end_state: [],
          inherits: "",
          music_intensity: 2,
          start_picture_prompt: "A fox at the edge of the ice",
          video_prompt: "The fox taps the ice and it cracks",
        },
      ],
    },
  },
  { name: "review_plan", input: {} },
  { name: "review_start", input: { asset_id: "still", shot_id: "dawn" } },
  { name: "check_design", input: { asset_id: "still", shot_id: "dawn" } },
  {
    name: "record_lesson",
    input: {
      lesson: "Keep the paw large in the frame",
      cause: "The paw missed the ice",
      shot_id: "dawn",
    },
  },
  { name: "get_shot_brief", input: { shot_id: "dawn" } },
];

export const reviewCalls: ScriptedCall[] = [
  {
    name: "generate_assets",
    input: {
      calls: [
        {
          asset_id: "together",
          capability: "image",
          input: { prompt: "a fox by the lake" },
        },
      ],
    },
  },
  { name: "review_clip", input: { asset_id: "clip", shot_id: "dawn" } },
  {
    name: "review_several",
    input: { reviews: [{ tool: "review_sheet", cast_id: "fox" }] },
  },
  { name: "view_for_review", input: {} },
  {
    name: "give_plan_review",
    input: {
      checks: [],
      findings: [],
      shots: [],
      cast: [],
      faults: ["x"],
      notes: [],
      verdict: "fail",
      easiest_shot_id: "dawn",
      hardest_shot_id: "dawn",
    },
  },
  {
    name: "give_sheet_review",
    input: { checks: [], counts: [], verdict: "fail", faults: ["x"] },
  },
  {
    name: "give_start_review",
    input: { checks: [], counts: [], verdict: "fail", faults: ["x"] },
  },
  {
    name: "give_clip_review",
    input: {
      checks: [],
      counts: [],
      action: { happened: false, seen: "nothing" },
      end_entries: [],
      start_match: { matches: false, seen: "another picture" },
      warnings: [],
      verdict: "redo",
      faults: [{ fault: "x", from_seconds: 0, to_seconds: 1 }],
    },
  },
];

export const musicCalls: ScriptedCall[] = [
  { name: "check_music", input: { asset_id: "tune" } },
];
