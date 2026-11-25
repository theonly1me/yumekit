import { videoPromptLimit } from "../storyPlan/firstFrameRule.js";
import type { GenerateAssetInput } from "./generateAssetInput.js";

export function promptSentOf(options: {
  written: unknown;
  sent: unknown;
}): string | undefined {
  const { written, sent } = options;
  if (typeof sent !== "string") return undefined;
  if (sent !== written) {
    throw new Error(
      "yumekit changed the prompt of the call before it sent it.",
    );
  }
  return sent;
}

export function promptFieldsOf(prompt: string) {
  return { prompt_from_you: prompt, prompt_characters: prompt.length };
}

export function promptLineOf(prompt: string): string {
  return `The prompt for the model is exactly as you wrote it: ${String(prompt.length)} characters. yumekit added nothing.`;
}

export function longPromptNoteOf(options: {
  request: GenerateAssetInput;
  prompt: string | undefined;
}): string | undefined {
  const { prompt } = options;
  if (options.request.capability !== "video" || prompt === undefined) {
    return undefined;
  }
  if (prompt.length <= videoPromptLimit) return undefined;
  return `The video prompt has ${String(prompt.length)} characters. Keep it under ${String(videoPromptLimit)} and about this shot only: what moves in time order, the camera, and what stays still.`;
}
