import type { Asset } from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import { sourceTextOf } from "./tryRules.js";

export function withPlannedPrompt(options: {
  request: GenerateAssetInput;
  planned: string[];
  made: Asset[];
}): GenerateAssetInput {
  const { request, planned } = options;
  if (typeof request.input["prompt"] === "string") return request;
  const sent = options.made.flatMap((asset) => {
    const prompt = sourceTextOf({ asset, field: "prompt" });
    return prompt === undefined ? [] : [prompt];
  });
  const prompt =
    planned.find(
      (candidate) => !sent.some((text) => text.startsWith(candidate.trim())),
    ) ?? planned[0];
  return prompt === undefined
    ? request
    : { ...request, input: { ...request.input, prompt } };
}
