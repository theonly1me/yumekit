import type { ScriptedCall } from "./everyToolCall.js";

export const takeCalls: ScriptedCall[] = [
  {
    name: "set_approve_pictures_first",
    input: { approve_pictures_first: false },
  },
  { name: "open_take", input: { step: "pictures" } },
  {
    name: "generate_asset",
    input: {
      asset_id: "take-still",
      capability: "image",
      input: { prompt: "a lake in fog", width_pixels: 64, height_pixels: 48 },
    },
  },
  {
    name: "ready_take",
    input: {
      items: [
        { id: "take-still", note: "The lake in fog. The far bank is soft." },
      ],
    },
  },
];
