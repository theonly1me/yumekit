export const readOn = "2026-11-21";

export const free = (unit: "image" | "second" | "minute") => [
  { usd: 0, unit, when: {} },
];

export const newKindModels = [
  {
    id: "sample-sound-effect",
    label: "Short high tone",
    capability: "sound-effect",
    is_default: true,
    settings: [
      {
        name: "duration_seconds",
        label: "Length in seconds",
        kind: "whole-number",
        minimum: 1,
        maximum: 30,
        default: 1,
      },
    ],
    prices: free("second"),
    read_on: readOn,
    accepts: ["length"],
    tested: true,
  },
  {
    id: "sample-talking-clip",
    label: "Your picture or video with the voice",
    capability: "talking-clip",
    is_default: true,
    settings: [],
    prices: free("second"),
    read_on: readOn,
    accepts: ["image_input", "video_input"],
    tested: true,
  },
  {
    id: "sample-sharper",
    label: "Plain larger copy",
    capability: "sharper",
    is_default: true,
    settings: [
      {
        name: "scale",
        label: "Times larger",
        kind: "whole-number",
        minimum: 2,
        maximum: 4,
        default: 2,
      },
    ],
    prices: free("second"),
    read_on: readOn,
    accepts: ["image_input", "video_input"],
    tested: true,
  },
] as const;
