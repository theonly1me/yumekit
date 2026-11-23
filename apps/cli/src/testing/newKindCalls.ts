import type { ScriptedCall } from "./everyToolCall.js";

export const soundEffectCalls: ScriptedCall[] = [
  {
    name: "generate_asset",
    input: {
      asset_id: "splash",
      capability: "sound-effect",
      input: { prompt: "a small splash", duration_seconds: 1 },
    },
  },
  {
    name: "place_sound",
    input: { output_id: "wide", asset_id: "splash", start_frame: 5 },
  },
  {
    name: "generate_asset",
    input: {
      asset_id: "still-sharper",
      capability: "sharper",
      input: { scale: 2 },
      media_asset_id: "still",
    },
  },
];

export const sharperCopyCalls: ScriptedCall[] = [
  { name: "make_sharper_copy", input: { output_id: "wide" } },
  {
    name: "generate_asset",
    input: {
      asset_id: "still-talking",
      capability: "talking-clip",
      input: {},
      media_asset_id: "still",
      voice_asset_id: "line-one",
      voice_part: { start_seconds: 0, duration_seconds: 1 },
    },
  },
  {
    name: "place_video",
    input: {
      output_id: "wide",
      asset_id: "still-talking",
      start_frame: 300,
      sound_gain_decibels: 0,
      quiet_voice: true,
    },
  },
];
