import type {
  Bible,
  PlanBudget,
  PlanReview,
  StoryPlan,
} from "@yumekit/project";
import { openBriefFaultsOf } from "../../storyPlan/briefFaultGate.js";
import type { HarnessFailure } from "../../results.js";
import { isPlanCheckUsedUp } from "./openPlanFaults.js";
import { briefFaultText } from "./planReviewRecord.js";

export const planChecksUsedUp: HarnessFailure = {
  kind: "plan-checks-used-up",
  message:
    "The critic failed the plan twice or more, so the plan check is used up. The paid work goes on: each open fault is a note on its shot or cast entry, and the critic checks it on each start picture and clip.",
  hint: "Make the sheets, then the easiest and the hardest shot. Correct the plan where you can with set_story_plan and put_cast_member. Give person_asked_for_another_check true only when the person asked for another plan check in this request.",
};

function openShotsText(plan: StoryPlan): string {
  const open = plan.shots.filter((shot) => (shot.planNotes ?? []).length > 0);
  if (open.length === 0) return "No shot carries an open plan fault.";
  return `These shots carry open plan faults, which the critic checks on each start picture and clip: ${open.map((shot) => `"${shot.id}" (${String((shot.planNotes ?? []).length)})`).join(", ")}.`;
}

function nextStepOf(options: {
  bible: Bible;
  plan: StoryPlan;
  review: PlanReview;
}): string {
  const { bible, plan, review } = options;
  const calibrate = `Make the sheets, then the easiest shot "${review.easiestShotId}" and the hardest shot "${review.hardestShotId}" first.`;
  if (review.verdict === "pass") return calibrate;
  if (!isPlanCheckUsedUp(plan)) {
    return "This was the first failed check of 2. Correct each fault in the plan, the facts, or the prompts, and call review_plan again. Sheet pictures can be made now. Start pictures and clips run after a pass, or after a second fail, when the check is used up and the open faults go to the critic of each shot as notes.";
  }
  const brief = openBriefFaultsOf({ bible, plan });
  const blocked =
    brief.length === 0
      ? ""
      : ` Still blocking, because the plan breaks the person's brief: ${brief.map(briefFaultText).join(" ")}`;
  return `The critic has failed the plan ${String(plan.failedPlanChecks ?? 0)} times, so the plan check is used up and the paid work can start. ${openShotsText(plan)}${blocked} ${calibrate}`;
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
