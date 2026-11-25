import type {
  Bible,
  PlanBudget,
  PlanReview,
  StoryPlan,
} from "@yumekit/project";
import { openBriefFaultsOf } from "../../storyPlan/briefFaultGate.js";
import { briefFaultText } from "./planReviewRecord.js";

function openShotsText(plan: StoryPlan): string {
  const open = plan.shots.filter((shot) => (shot.planNotes ?? []).length > 0);
  if (open.length === 0) return "No shot carries a note of the plan check.";
  return `These shots carry notes of the plan check, which get_shot_brief gives: ${open.map((shot) => `"${shot.id}" (${String((shot.planNotes ?? []).length)})`).join(", ")}.`;
}

function nextStepOf(options: {
  bible: Bible;
  plan: StoryPlan;
  review: PlanReview;
}): string {
  const { bible, plan, review } = options;
  const work =
    "The check is advice and nothing waits for it: make the next batch that get_work names.";
  if (review.verdict === "pass") return work;
  const brief = openBriefFaultsOf({ bible, plan });
  const blocked =
    brief.length === 0
      ? ""
      : ` Blocking, because the plan breaks the person's brief: ${brief.map(briefFaultText).join(" ")}`;
  return `Correct what serves the film with set_story_plan and put_cast_member. ${openShotsText(plan)}${blocked} ${work}`;
}

export function planCheckAnswerOf(options: {
  bible: Bible;
  plan: StoryPlan;
  review: PlanReview;
  budget: PlanBudget;
  criticCostUsd: number | undefined;
}) {
  const { plan, review, budget } = options;
  const faults =
    review.faults.length === 0 ? "." : `: ${review.faults.join("; ")}.`;
  const money =
    budget.warnings.length === 0
      ? ""
      : ` Before the money: ${budget.warnings.join(" ")}`;
  return {
    line: `The critic says ${review.verdict} for the plan${faults} ${nextStepOf(options)}${money}`,
    data: {
      verdict: review.verdict,
      faults: review.faults,
      notes: [
        ...review.notes,
        ...review.shots.flatMap((entry) =>
          entry.notes.map((note) => `Shot "${entry.shotId}": ${note}`),
        ),
      ],
      difficulty: Object.fromEntries(
        review.shots.map((entry) => [entry.shotId, entry.difficulty]),
      ),
      easiest_shot_id: review.easiestShotId,
      hardest_shot_id: review.hardestShotId,
      critic_seconds: review.seconds,
      failed_plan_checks: plan.failedPlanChecks ?? 0,
      shots_with_open_plan_faults: plan.shots
        .filter((shot) => (shot.planNotes ?? []).length > 0)
        .map((shot) => shot.id),
      budget_warnings: budget.warnings,
      cost_estimate_usd: budget.estimateUsd,
      ...(options.criticCostUsd === undefined
        ? {}
        : { critic_cost_usd: options.criticCostUsd }),
    },
  };
}
