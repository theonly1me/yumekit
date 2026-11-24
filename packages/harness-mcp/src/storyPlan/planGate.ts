import type { Bible, Shot, StoryPlan } from "@yumekit/project";
import { isPlanCheckUsedUp } from "../critic/plan/openPlanFaults.js";
import type { HarnessFailure } from "../results.js";
import { briefFaultFailureOf } from "./briefFaultGate.js";
import { planKeyOf } from "./planKey.js";
import { criticReviewsOf, refusalsOf } from "./shotRefusals.js";

export function isPlanReviewCurrent(options: {
  bible: Bible;
  plan: StoryPlan;
}): boolean {
  return options.plan.review?.planKey === planKeyOf(options);
}

export function planGateFailureOf(options: {
  bible: Bible;
  plan: StoryPlan;
  shot: Shot | undefined;
}): HarnessFailure | undefined {
  const { plan } = options;
  const { review } = plan;
  if (review !== undefined && isPlanCheckUsedUp(plan)) {
    return briefFaultFailureOf(options);
  }
  if (review === undefined || !isPlanReviewCurrent(options)) {
    return {
      kind: "plan-not-reviewed",
      message:
        review === undefined
          ? "The critic has not checked the plan yet. No start picture or clip of a story film runs before the plan check. A sheet picture can start once its cast entry has facts and sheet_prompts."
          : "The plan, the art direction, or a cast entry changed after the critic checked it.",
      hint: "Give each shot start_picture_prompt and video_prompt, give each cast entry its facts and sheet_prompts, then call review_plan.",
    };
  }
  if (review.verdict === "pass") return undefined;
  return {
    kind: "plan-failed-review",
    message: `The critic failed the plan: ${review.faults.join("; ")}.`,
    hint: "Correct each fault in the plan, the facts, or the prompts, and call review_plan again. After a second fail, the plan check is used up and the paid work starts with the open faults as notes for the critic.",
  };
}

export function calibrationShotIdsOf(plan: StoryPlan): string[] {
  const { review } = plan;
  if (review === undefined) return [];
  const ids = [...new Set([review.easiestShotId, review.hardestShotId])];
  return ids.filter((id) => plan.shots.some((shot) => shot.id === id));
}

function isRefused(shot: Shot): boolean {
  return refusalsOf({ shot }).length > 0;
}

export function calibrationFailureOf(options: {
  plan: StoryPlan;
  shot: Shot;
}): HarnessFailure | undefined {
  const { plan, shot } = options;
  const calibration = calibrationShotIdsOf(plan);
  if (calibration.includes(shot.id)) return undefined;
  const tried = plan.shots.filter(
    (candidate) =>
      criticReviewsOf(candidate).length > 0 ||
      (candidate.startReviews ?? []).some(
        (review) => review.verdict === "fail",
      ),
  );
  if (tried.length < calibration.length) {
    return {
      kind: "calibrate-first",
      message: `The plan check named the easiest shot "${plan.review?.easiestShotId ?? ""}" and the hardest shot "${plan.review?.hardestShotId ?? ""}". They come first, so their faults teach the other shots.`,
      hint: `Make and review the clips of ${calibration.map((id) => `"${id}"`).join(" and ")} first.`,
    };
  }
  const unlearned = calibration.filter(
    (id) =>
      plan.shots.some(
        (candidate) => candidate.id === id && isRefused(candidate),
      ) && !(plan.lessons ?? []).some((lesson) => lesson.shotId === id),
  );
  if (unlearned.length === 0) return undefined;
  return {
    kind: "lessons-missing",
    message: `The critic refused ${unlearned.map((id) => `"${id}"`).join(" and ")}, and no lesson says what the other shots must do differently.`,
    hint: `Call record_lesson with the cause and the form that works, and shot_id ${unlearned.map((id) => `"${id}"`).join(" or ")}. The harness adds each lesson to every later prompt.`,
  };
}
