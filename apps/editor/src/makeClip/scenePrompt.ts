import type { Asset, Scene } from "../engine/snapshot.js";

const cameraWords = "Slow camera move, natural light.";

function isIdName(name: string): boolean {
  return /Ids?$/.test(name);
}

function textsOf(props: Record<string, unknown>): string[] {
  return Object.entries(props).flatMap(([name, value]) => {
    if (isIdName(name)) return [];
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === "string");
    }
    return [];
  });
}

function sentenceOf(text: string): string {
  return text.trim().replace(/[.!?:;,]+$/, "");
}

function earlierPromptOf(options: {
  scene: Scene;
  assets: Asset[];
}): string | undefined {
  const assetId = options.scene.source.props["assetId"];
  const asset = options.assets.find((candidate) => candidate.id === assetId);
  if (asset?.kind !== "video" || asset.source.kind !== "tool") return undefined;
  const prompt = asset.source.input["prompt"];
  return typeof prompt === "string" && prompt.trim() !== ""
    ? prompt
    : undefined;
}

export function promptOfScene(options: {
  scene: Scene;
  assets: Asset[];
}): string {
  const earlier = earlierPromptOf(options);
  if (earlier !== undefined) return earlier;
  const texts = textsOf(options.scene.source.props)
    .map(sentenceOf)
    .filter((text) => text !== "");
  const parts = texts.length === 0 ? [sentenceOf(options.scene.title)] : texts;
  return `${parts.join(". ")}. ${cameraWords}`;
}
