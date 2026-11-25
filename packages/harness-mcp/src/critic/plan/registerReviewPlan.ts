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
import { bibleAfterPlanCheck, openPlanFaultsOf } from "./openPlanFaults.js";
import { planCheckAnswerOf } from "./planCheckAnswer.js";
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
      "Have the independent critic read the whole plan before the money, as advice: the story, the facts of each sheet, and the text of each sheet, start picture, and video prompt that you will send. Nothing waits for it. Each fault it finds becomes a note on its shot or cast entry, which get_work shows. It rates each shot from 1 (easy) to 5. Only a fault that breaks a fact of the person's brief blocks the shots it touches, until its exact text is restored. It warns when the planned seconds or money pass a limit. It costs no media money and one critic turn, so call it when the person asks for a second look at the plan.",
    inputSchema: {},
    run: ({ onProgress }) =>
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
            const budget = await planBudgetWith({
              mediaTools: context.mediaTools,
              bible: latest,
              plan: latestPlan,
            });
            const next = bibleAfterPlanCheck({
              bible: latest,
              plan: latestPlan,
              review,
              open: openPlanFaultsOf({ job, answer }),
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
