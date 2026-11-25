import { z } from "zod";
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
import { inReviewSlot } from "../reviewSlot.js";
import { planBudgetWith } from "../../storyPlan/planCost.js";
import {
  bibleAfterPlanCheck,
  isPlanCheckUsedUp,
  openPlanFaultsOf,
  planCheckLimit,
} from "./openPlanFaults.js";
import { planCheckAnswerOf, planChecksUsedUp } from "./planCheckAnswer.js";
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
      "Have the independent critic check the whole plan before the first paid picture or clip: the story, the facts of each sheet, and the text of each sheet, start picture, and video prompt that you will send. It blocks only what is likely to fail: a break of a fact of the person's brief, a prompt that contradicts itself, a known limit or a restriction with no working form, and a strike or effect with no contact or source, at most 3 for one shot. Everything else is a note. It rates each shot from 1 (easy) to 5 and names the easiest and the hardest shot: make those two first. Start pictures and clips wait for a pass; sheet pictures do not. The check has a limit: after the second fail, it is used up, the paid work starts, and each open fault goes to the critic of its shot as a note. A fault that breaks a fact of the person's brief still blocks until its exact text is restored. It warns when the planned seconds or money pass a limit. It costs no media money.",
    inputSchema: {
      person_asked_for_another_check: z
        .boolean()
        .optional()
        .describe(
          "True only when the person asked for another plan check in this request, after the check is used up.",
        ),
    },
    run: ({ input, onProgress }) =>
      inReviewSlot({
        context,
        subject: {
          id: "plan",
          what: "the plan check",
          subject: "the plan",
        },
        run: async (ticket) => {
          const { bible } = context.store.read();
          const plan = bible.storyPlan;
          if (plan === undefined) {
            return failureResult({
              kind: "story-plan-missing",
              message: "This project has no story plan to check.",
              hint: "Read get_story_guide and write the plan with set_story_plan first.",
            });
          }
          if (
            isPlanCheckUsedUp(plan) &&
            input.person_asked_for_another_check !== true
          ) {
            return failureResult(planChecksUsedUp);
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
            ticket,
            job,
            brief: planBriefOf(job),
            subject: "the plan",
          });
          if (!turn.ok) return failureResult(turn.failure);
          const { answer } = job;
          if (answer === undefined) throw new Error("runCritic checks it.");
          const review = planReviewOf({
            job,
            answer,
            seconds: turn.value.seconds,
          });
          return context.writeLatest(async () => {
            const latest = context.store.read().bible;
            const latestPlan = latest.storyPlan ?? plan;
            const usedUp =
              review.verdict === "fail" &&
              (latestPlan.failedPlanChecks ?? 0) + 1 >= planCheckLimit;
            const budget = await planBudgetWith({
              mediaTools: context.mediaTools,
              bible: latest,
              plan: latestPlan,
            });
            const next = bibleAfterPlanCheck({
              bible: latest,
              plan: latestPlan,
              review,
              open: usedUp ? openPlanFaultsOf({ job, answer }) : undefined,
              costEstimateUsd: budget.estimateUsd ?? 0,
            });
            const answerText = planCheckAnswerOf({
              bible: next,
              plan: next.storyPlan ?? latestPlan,
              review,
              budget,
              criticCostUsd: turn.value.costUsd,
            });
            return applyEditsResult({
              store: context.store,
              edits: [{ kind: "setBible", bible: next }],
              line: answerText.line,
              data: answerText.data,
            });
          });
        },
      }),
  });
}
