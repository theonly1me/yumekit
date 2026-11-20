import { join, relative, sep } from "node:path";
import type { Asset, JsonObject } from "@yumekit/project";

type JsonValue = JsonObject[string];

export function assetFilesFolder(projectFolder: string): string {
  return join(projectFolder, "assets", "files");
}

export function projectFileOf(options: {
  projectFolder: string;
  path: string;
}): string {
  return relative(options.projectFolder, options.path).split(sep).join("/");
}

export function framesOfSeconds(options: {
  seconds: number;
  framesPerSecond: number;
}): number {
  return Math.round(options.seconds * options.framesPerSecond);
}

export function wordsInFrames(options: {
  words: { text: string; start_seconds: number; end_seconds: number }[];
  framesPerSecond: number;
}) {
  const { framesPerSecond } = options;
  return {
    words: options.words.map((word) => {
      const startFrame = framesOfSeconds({
        seconds: word.start_seconds,
        framesPerSecond,
      });
      const endFrame = framesOfSeconds({
        seconds: word.end_seconds,
        framesPerSecond,
      });
      return {
        text: word.text,
        startFrame,
        endFrame: Math.max(startFrame, endFrame),
      };
    }),
  };
}

function stableJson(value: JsonValue | undefined): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

export function findReusableAsset(options: {
  assets: Asset[];
  server: string;
  tool: string;
  input: JsonObject;
}): Asset | undefined {
  const inputKey = stableJson(options.input);
  return options.assets.find(
    (asset) =>
      asset.source.kind === "tool" &&
      asset.source.server === options.server &&
      asset.source.tool === options.tool &&
      stableJson(asset.source.input) === inputKey,
  );
}
