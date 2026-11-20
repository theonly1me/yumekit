import type { JsonObject, SceneAsset } from "@yumekit/scene";

export const longText =
  "How one small team turns one idea into a long explainer, three shorts, and a set of stills with the AI tools it owns now";

export const kitSceneNames = [
  "title-card",
  "bullet-list",
  "image-pan",
  "caption-words",
  "bar-chart",
  "quote",
  "video-clip",
] as const;

export const typicalProps: Record<(typeof kitSceneNames)[number], JsonObject> =
  {
    "title-card": {
      heading: "Your idea, as a video.",
      subheading: "Made on your own machine",
    },
    "bullet-list": {
      heading: "You bring",
      items: ["An idea", "Your AI plan", "Your own tools"],
    },
    "image-pan": {
      assetId: "photo",
      caption: "A slow move over one image",
      direction: "right",
    },
    "caption-words": {
      text: "Every frame stays editable by prompt or by hand.",
    },
    "bar-chart": {
      heading: "Ten minutes of video",
      bars: [
        { label: "Generated clips", value: 240 },
        { label: "Drawn from code", value: 0 },
      ],
      valuePrefix: "$",
    },
    quote: { quote: "Every frame stays editable.", source: "The yumekit team" },
    "video-clip": {
      assetId: "clip",
      caption: "A generated clip",
      focus: { x: 0.5, y: 0.4 },
    },
  };

export const longProps: Record<(typeof kitSceneNames)[number], JsonObject> = {
  "title-card": { heading: longText, subheading: longText },
  "bullet-list": {
    heading: longText,
    items: [longText, longText, longText, longText, longText, longText],
  },
  "image-pan": { assetId: "photo", caption: longText },
  "caption-words": { text: `${longText} ${longText}` },
  "bar-chart": {
    heading: longText,
    bars: Array.from({ length: 8 }, (...[, index]) => ({
      label: longText.slice(0, 60),
      value: 1_000_000_000 * (index + 1),
    })),
    valuePrefix: "USD ",
    valueSuffix: " total",
  },
  quote: { quote: longText, source: longText },
  "video-clip": { assetId: "clip", caption: longText },
};

export async function testImageAsset(): Promise<SceneAsset> {
  const canvas = new OffscreenCanvas(64, 48);
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("No 2D canvas context");
  }
  context.fillStyle = "#336699";
  context.fillRect(0, 0, 64, 48);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return {
    kind: "image",
    url: URL.createObjectURL(blob),
    widthPixels: 64,
    heightPixels: 48,
  };
}
