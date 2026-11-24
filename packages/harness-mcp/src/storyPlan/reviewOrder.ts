import type { ReviewVerdict } from "@yumekit/project";
import type { HarnessFailure } from "../results.js";

export function isPassed(verdict: ReviewVerdict | undefined): boolean {
  return verdict === "keep" || verdict === "cut";
}

export function notShownFailureOf(input: {
  asset_id: string;
  shot_id: string;
}): HarnessFailure {
  return {
    kind: "clip-not-shown",
    message: `Look at the clip "${input.asset_id}" before you keep it: its frames, its measures, and the check list of shot "${input.shot_id}".`,
    hint: `Call review_clip with asset_id "${input.asset_id}" and shot_id "${input.shot_id}" and no verdict, check each point, then give the verdict.`,
  };
}
