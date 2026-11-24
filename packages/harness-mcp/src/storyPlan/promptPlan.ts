import type { Asset } from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { promptNotReviewed, sourceTextOf } from "./tryRules.js";

export function withReviewedPrompt(options: {
  request: GenerateAssetInput;
  planned: string[];
  made: Asset[];
  subject: string;
}): Outcome<GenerateAssetInput, HarnessFailure> {
  const { request, planned } = options;
  if (planned.length === 0) return { ok: true, value: request };
  const given = request.input["prompt"];
  if (typeof given === "string") {
    return planned.some((prompt) => prompt.trim() === given.trim())
      ? { ok: true, value: request }
      : {
          ok: false,
          failure: promptNotReviewed({ subject: options.subject, planned }),
        };
  }
  const sent = options.made.flatMap((asset) => {
    const prompt = sourceTextOf({ asset, field: "prompt" });
    return prompt === undefined ? [] : [prompt];
  });
  const prompt =
    planned.find(
      (candidate) => !sent.some((text) => text.startsWith(candidate.trim())),
    ) ?? planned[0];
  return prompt === undefined
    ? { ok: true, value: request }
    : { ok: true, value: { ...request, input: { ...request.input, prompt } } };
}
