import type { Asset } from "@yumekit/project";
import { knownLimits } from "../storyGuide/knownLimits.js";
import type { HarnessFailure } from "../results.js";

export type TryStep = "first" | "refine" | "simplify" | "used-up";

export function tryStepOf(refusals: number): TryStep {
  if (refusals === 0) return "first";
  if (refusals === 1) return "refine";
  return refusals === 2 ? "simplify" : "used-up";
}

export function sourceTextOf(options: {
  asset: Asset;
  field: string;
}): string | undefined {
  const { asset } = options;
  if (asset.source.kind !== "tool") return undefined;
  const value = asset.source.input[options.field];
  return typeof value === "string" ? value : undefined;
}

export function sourceIdsOf(options: {
  asset: Asset | undefined;
  field: string;
}): string[] {
  const { asset } = options;
  if (asset?.source.kind !== "tool") return [];
  const value = asset.source.input[options.field];
  return Array.isArray(value)
    ? value.filter((entry) => typeof entry === "string")
    : [];
}

export function simplifyFirst(subject: string): HarnessFailure {
  return {
    kind: "simplify-first",
    message: `${subject} was refused twice. A third try of the same approach is refused.`,
    hint: `Make ONE simplified try: give simpler_form with what is simpler now, and change the prompt to a form that works. The simpler forms: ${knownLimits.map((limit) => `${limit.id}: ${limit.form}`).join(" ")} If both refusals had the same cause, record it with record_lesson and is_limit true.`,
  };
}

export function triesUsedUp(options: {
  subject: string;
  best: string;
  aroundIt: string;
}): HarnessFailure {
  return {
    kind: "tries-used-up",
    message: `${options.subject} was refused three times: two tries and one simplified try. ${options.best}`,
    hint: `${options.aroundIt} Or ask the person; give person_asked_for_another_try true only when the person asked for another try in this request.`,
  };
}

export function reviewFirst(options: {
  subject: string;
  tool: string;
}): HarnessFailure {
  return {
    kind: "review-first",
    message: `${options.subject} has a try that the critic has not reviewed yet.`,
    hint: `Call ${options.tool} for it first. A new try follows from the faults of the last one.`,
  };
}

export function promptNotReviewed(options: {
  subject: string;
  planned: string[];
}): HarnessFailure {
  return {
    kind: "prompt-not-reviewed",
    message: `The first try of ${options.subject} sends the prompt that the critic checked in review_plan, and this prompt differs.`,
    hint: `Leave out input.prompt to use the reviewed prompt${options.planned.length === 0 ? "" : ` ("${options.planned.join('" or "')}")`}. To send another prompt, change the plan or the sheet_prompts and call review_plan again.`,
  };
}
