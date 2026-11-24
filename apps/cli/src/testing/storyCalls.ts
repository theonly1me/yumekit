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
          music_intensity: 2,
          inherits: "",
          start_picture_prompt: "A fox at the edge of the ice",
          video_prompt: "The fox taps the ice and it cracks",
        },
      ],
    },
  },
  {
    name: "record_lesson",
    input: { lesson: "Keep the paw large", cause: "The paw missed" },
  },
];

export const reviewCalls: ScriptedCall[] = [
  { name: "review_clip", input: { asset_id: "clip", shot_id: "dawn" } },
  { name: "review_sheet", input: { cast_id: "lake" } },
  { name: "review_plan", input: {} },
  { name: "review_start", input: { asset_id: "still", shot_id: "dawn" } },
  { name: "check_music", input: { asset_id: "still" } },
];
