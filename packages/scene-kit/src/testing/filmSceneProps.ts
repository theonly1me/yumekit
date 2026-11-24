import type { JsonObject } from "@yumekit/scene";

export const filmSceneNames = [
  "footage",
  "wall",
  "shapes",
  "lines",
  "look-swap",
  "command",
  "counts",
] as const;

type FilmSceneName = (typeof filmSceneNames)[number];

const longLine =
  "One small team turns one idea into a long explainer and three shorts";

function textOf(length: number): string {
  return Array.from(
    { length: Math.ceil(length / longLine.length) },
    () => longLine,
  )
    .join(" ")
    .slice(0, length);
}

export const filmTypicalProps: Record<FilmSceneName, JsonObject> = {
  footage: {
    heading: "Type what you want.",
    assetId: "photo",
    region: { x: 0.2, y: 0.1, width: 0.6, height: 0.3 },
  },
  wall: {
    heading: "Real scenes, drawn by code.",
    assetIds: ["photo", "photo", "photo", "photo"],
  },
  shapes: {
    heading: "One idea. Every platform.",
    accent: "Every platform.",
    assetIds: ["photo", "photo"],
    labels: ["YouTube 16:9", "Square 1:1"],
  },
  lines: {
    lines: ["On your computer.", "No account.", "Open source."],
    accentLine: 3,
  },
  "look-swap": {
    heading: "One click, a new look.",
    assetIds: ["photo", "photo"],
    labels: ["Midnight", "Editorial"],
  },
  command: {
    heading: "yumekit",
    command: "npm install -g yumekit",
    note: "Works with the AI you already use",
  },
  counts: {
    heading: "Ready to use.",
    items: [
      { value: 26, label: "scene types" },
      { value: 5, label: "looks" },
    ],
  },
};

export const filmLongProps: Record<FilmSceneName, JsonObject> = {
  footage: {
    heading: textOf(80),
    accent: "explainer",
    assetId: "photo",
    stops: [
      { region: { x: 0, y: 0, width: 0.3, height: 0.2 } },
      { region: { x: 0.7, y: 0.8, width: 0.3, height: 0.2 } },
    ],
    speed: 2,
  },
  wall: {
    heading: textOf(80),
    assetIds: Array.from({ length: 16 }, () => "photo"),
  },
  shapes: {
    heading: textOf(80),
    assetIds: ["photo", "photo", "photo"],
    labels: [textOf(40), textOf(40), textOf(40)],
  },
  lines: {
    lines: [textOf(60), "Incomprehensibilities", textOf(60), textOf(60)],
    accentLine: 4,
  },
  "look-swap": {
    heading: textOf(80),
    assetIds: Array.from({ length: 6 }, () => "photo"),
    labels: Array.from({ length: 6 }, () => textOf(40)),
    region: { x: 0.1, y: 0.1, width: 0.2, height: 0.8 },
  },
  command: {
    heading: textOf(40),
    command: textOf(60),
    note: textOf(100),
  },
  counts: {
    heading: textOf(80),
    items: [
      {
        value: 123_456_789,
        prefix: "USD ",
        suffix: " a day",
        label: textOf(40),
      },
      { value: 98.5, suffix: "%", label: textOf(40) },
      { value: 7, label: textOf(40) },
    ],
  },
};
