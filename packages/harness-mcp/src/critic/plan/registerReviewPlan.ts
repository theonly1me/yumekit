import { applyEditsResult } from "../../applyEditsResult.js";
import type { HarnessContext } from "../../context.js";
import { failureResult } from "../../results.js";
import {
  planGapsOf,
  planKeyOf,
  planMembersOf,
} from "../../storyPlan/planKey.js";
import type { CriticDesk } from "../criticDesk.js";
import type { AskCritic } from "../criticTypes.js";
import { runCritic } from "../runCritic.js";
import { planFindingsOf } from "./planFindings.js";
import { planBriefOf, type PlanJob } from "./planJob.js";
import { planReviewOf } from "./planReviewRecord.js";

export function registerReviewPlan(
  context: HarnessContext & {
    critics: CriticDesk;
    askCritic: AskCritic | undefined;
  },
): void {
  context.tools.add({
    name: "review_plan",
    description:
      "Have the independent critic check the whole plan before the first paid picture or clip: the story, the facts of each sheet, and the text of each sheet, start picture, and video prompt that you will send. It refuses what is likely to fail: a fact that no picture can show or that is a bare number, a shot on the list of known limits, a shot with more than one action, a prompt that leaves a visible part undescribed, a thin design that the model will copy from a known work, a place fact that a later shot breaks, a shot that breaks a restriction. It rates each shot from 1 (easy) to 5 and names the easiest and the hardest shot: make those two first. Paid pictures and clips wait for a pass. It costs no media money.",
    inputSchema: {},
    run: async ({ onProgress }) => {
      const { bible } = context.store.read();
      const plan = bible.storyPlan;
      if (plan === undefined) {
        return failureResult({
          kind: "story-plan-missing",
          message: "This project has no story plan to check.",
          hint: "Read get_story_guide and write the plan with set_story_plan first.",
        });
      }
      const gaps = planGapsOf({ bible, plan });
      if (gaps.length > 0) {
        return failureResult({
          kind: "plan-incomplete",
          message: `The critic checks the whole first cut, and the plan is not whole: ${gaps.join("; ")}.`,
          hint: "Give each shot start_picture_prompt and video_prompt in set_story_plan, and give each person, place, and prop its facts and sheet_prompts with put_cast_member. Then call review_plan again.",
        });
      }
      const members = planMembersOf({ bible, plan });
      const job: PlanJob = {
        kind: "plan",
        plan,
        members,
        style: bible.style,
        findings: planFindingsOf(members),
        planKey: planKeyOf({ bible, plan }),
        answer: undefined,
      };
      onProgress?.({ done: 0, message: "The critic reads the plan" });
      const turn = await runCritic({
        askCritic: context.askCritic,
        critics: context.critics,
        job,
        brief: planBriefOf(job),
        subject: "the plan",
      });
      if (!turn.ok) return failureResult(turn.failure);
      const { answer } = job;
      if (answer === undefined) throw new Error("runCritic checks it.");
      const review = planReviewOf({ job, answer, seconds: turn.value.seconds });
      const latest = context.store.read().bible;
      const latestPlan = latest.storyPlan ?? plan;
      const next =
        review.verdict === "pass"
          ? `Make the sheets, then the easiest shot "${review.easiestShotId}" and the hardest shot "${review.hardestShotId}" first.`
          : "Correct each fault in the plan, the facts, or the prompts, and call review_plan again. No paid picture or clip runs before a pass.";
      return applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "setBible",
            bible: { ...latest, storyPlan: { ...latestPlan, review } },
          },
        ],
        line: `The critic says ${review.verdict} for the plan${review.faults.length === 0 ? "." : `: ${review.faults.join("; ")}.`} ${next}`,
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
          ...(turn.value.costUsd === undefined
            ? {}
            : { critic_cost_usd: turn.value.costUsd }),
        },
      });
    },
  });
}
