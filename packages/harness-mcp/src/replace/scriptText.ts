import { voiceMatchesScript, type Asset } from "@yumekit/project";
import type { HarnessFailure } from "../results.js";

export function scriptLinesOf(script: string): string[] {
  return script
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

export function spokenTextOf(asset: Asset): string | undefined {
  if (asset.source.kind !== "tool") return undefined;
  if (asset.source.tool !== "generate_speech") return undefined;
  const { text } = asset.source.input;
  return typeof text === "string" ? text : undefined;
}

export function notInScriptFailureOf(options: {
  script: string;
  text: string | undefined;
}): HarnessFailure | undefined {
  const { script, text } = options;
  const lines = scriptLinesOf(script);
  if (text === undefined || lines.length === 0) return undefined;
  if (voiceMatchesScript({ script, voiceTexts: [text] })) return undefined;
  return {
    kind: "text-not-in-the-script",
    message: `The voice text is not in the script. The script has these lines:\n${lines.map((line) => `- ${line}`).join("\n")}`,
    hint: "Use the lines of the script word for word. To say other words, change the script first with set_script.",
  };
}
