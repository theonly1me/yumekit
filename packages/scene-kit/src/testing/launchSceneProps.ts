import type { JsonObject } from "@yumekit/scene";

export const launchSceneNames = [
  "hero",
  "stat",
  "compare",
  "steps",
  "chat",
  "device",
  "split",
  "logo-reveal",
  "checklist",
  "end-card",
  "lower-third",
  "kinetic",
] as const;

type LaunchSceneName = (typeof launchSceneNames)[number];

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

export const launchTypicalProps: Record<LaunchSceneName, JsonObject> = {
  hero: {
    heading: "Your idea, as a video in minutes.",
    accentWord: "video",
    kicker: "Introducing yumekit",
  },
  stat: { value: 98, suffix: "%", label: "of the frames stay editable" },
  compare: {
    left: "Before",
    right: "After",
    rows: [
      { left: "Ten tools", right: "One folder" },
      { left: "Hours of keyframes", right: "One line of motion" },
    ],
  },
  steps: {
    heading: "How it works",
    steps: ["Write the idea", "Pick a look", "Export"],
  },
  chat: {
    request: "Make a launch video",
    answer: "Done. Three scenes with captions.",
    names: { request: "You", answer: "yumekit" },
  },
  device: { assetId: "photo", caption: "Your whole video in one view" },
  split: {
    assetId: "photo",
    heading: "Real footage",
    body: "Drop in a clip and the scene keeps it in step.",
  },
  "logo-reveal": { name: "yumekit", tagline: "Videos from your machine" },
  checklist: { heading: "Included", items: ["Five looks", "Captions"] },
  "end-card": {
    heading: "Make your first video",
    action: "Get started",
    handle: "example.com",
  },
  "lower-third": { name: "Aiko Tanaka", role: "Founder" },
  kinetic: { lines: ["No timeline.", "Just your idea."] },
};

export const launchLongProps: Record<LaunchSceneName, JsonObject> = {
  hero: {
    heading: textOf(120),
    accentWord: "explainer",
    kicker: textOf(60),
  },
  stat: {
    value: 123_456_789.25,
    prefix: "USD ",
    suffix: " per month",
    label: textOf(120),
  },
  compare: {
    left: textOf(40),
    right: textOf(40),
    rows: Array.from({ length: 5 }, () => ({
      left: textOf(80),
      right: textOf(80),
    })),
  },
  steps: {
    heading: textOf(100),
    steps: Array.from({ length: 5 }, () => textOf(80)),
  },
  chat: {
    request: textOf(160),
    answer: textOf(240),
    names: { request: textOf(30), answer: textOf(30) },
  },
  device: { assetId: "photo", frame: "phone", caption: textOf(120) },
  split: {
    assetId: "photo",
    heading: textOf(100),
    body: textOf(200),
    side: "right",
  },
  "logo-reveal": {
    name: "Supercalifragilisticexpialidocious & co",
    assetId: "photo",
    tagline: textOf(100),
  },
  checklist: {
    heading: textOf(120),
    items: Array.from({ length: 6 }, () => textOf(100)),
  },
  "end-card": {
    heading: textOf(100),
    action: textOf(40),
    handle: textOf(60),
  },
  "lower-third": { name: textOf(50), role: textOf(80) },
  kinetic: {
    lines: [
      textOf(80),
      "Incomprehensibilities",
      textOf(80),
      "Pneumonoultramicroscopicsilicovolcanoconiosis",
    ],
  },
};
