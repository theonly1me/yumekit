import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { regionInput } from "../media/markInputs.js";
import { failureResult, successResult } from "../results.js";
import { clipAnswerIssuesOf } from "./clip/clipAnswerCheck.js";
import { clipAnswerInput } from "./clip/clipAnswerInput.js";
import { clipViewOf } from "./clip/clipViews.js";
import type { CriticDesk } from "./criticDesk.js";
import { planAnswerIssuesOf } from "./plan/planAnswerCheck.js";
import { planAnswerInput } from "./plan/planAnswerInput.js";
import { withoutRepeatedFaults } from "./plan/repeatedFaults.js";
import { registerGiveStartReview } from "./start/giveStartReview.js";
import {
  sheetAnswerInput,
  sheetAnswerIssuesOf,
  sheetViewOf,
} from "./sheet/sheetJob.js";

const noJob = {
  kind: "no-review-job",
  message:
    "No review is open. Only a critic that the harness started can answer.",
  hint: "Stop now.",
};

function answerRefused(issues: string[]) {
  return failureResult({
    kind: "review-not-valid",
    message: `The answer is not whole: ${issues.join(" ")}`,
    hint: "Look again where you need to, correct the answer, and call again with the whole answer.",
  });
}

const viewInput = {
  asset_id: idInput(
    "A picture of the review for a closer look. Default: the clip.",
  ).optional(),
  region: regionInput
    .optional()
    .describe("Show only this part, as shares from 0 to 1."),
  from_seconds: z.number().min(0).optional().describe("The clip from here."),
  to_seconds: z.number().gt(0).optional().describe("The clip to here."),
};

export function registerCriticTools(
  context: HarnessContext & { critics: CriticDesk },
): void {
  const { critics } = context;
  context.tools.add({
    name: "view_for_review",
    description:
      "For the critic only. With no input: every frame of the clip at 8 each second, the start picture next to the first frame, the end of the shot before, and the sheet pictures; or each picture of a sheet. With a region and a time: a closer look.",
    inputSchema: viewInput,
    annotations: { readOnlyHint: true },
    run: async ({ input }) => {
      const job = critics.current();
      if (job === undefined) return failureResult(noJob);
      if (job.kind === "plan") {
        return {
          content: [
            {
              type: "text",
              text: "The plan has no pictures yet. Each shot, fact, and prompt is in the brief.",
            },
          ],
        };
      }
      const view =
        job.kind === "clip"
          ? await clipViewOf({ context, job, look: input })
          : await sheetViewOf({ context, job, look: input });
      if (!view.ok) return failureResult(view.failure);
      return { content: view.value };
    },
  });
  context.tools.add({
    name: "give_clip_review",
    description:
      "For the critic only: your whole answer about the clip. Answer each item of the list, each measured warning, the counts, the action and each end entry, the match of the first frame, the verdict, and the faults with their times.",
    inputSchema: clipAnswerInput,
    run: ({ input }) => {
      const job = critics.current();
      if (job?.kind !== "clip") return failureResult(noJob);
      const issues = clipAnswerIssuesOf({ job, answer: input });
      if (issues.length > 0) return answerRefused(issues);
      job.answer = input;
      return successResult({
        line: `Your verdict "${input.verdict}" is recorded. Stop now.`,
        data: { verdict: input.verdict },
      });
    },
  });
  context.tools.add({
    name: "give_sheet_review",
    description:
      "For the critic only: your whole answer about a sheet. Answer each item of the list, the counts, the verdict, and the faults.",
    inputSchema: sheetAnswerInput,
    run: ({ input }) => {
      const job = critics.current();
      if (job?.kind !== "sheet") return failureResult(noJob);
      const issues = sheetAnswerIssuesOf({ job, answer: input });
      if (issues.length > 0) return answerRefused(issues);
      job.answer = input;
      return successResult({
        line: `Your verdict "${input.verdict}" is recorded. Stop now.`,
        data: { verdict: input.verdict },
      });
    },
  });
  context.tools.add({
    name: "give_plan_review",
    description:
      "For the critic only: your whole answer about the plan. Answer each item of the list and each finding, rate each shot, judge each cast entry, sort each fault as blocking or a note (at most 3 blocking for one shot; a fault of one shot goes in its entry, once), put each break of a brief fact in brief_faults, name the easiest and the hardest shot, and give the verdict.",
    inputSchema: planAnswerInput,
    run: ({ input }) => {
      const job = critics.current();
      if (job?.kind !== "plan") return failureResult(noJob);
      const answer = withoutRepeatedFaults({ plan: job.plan, answer: input });
      const issues = planAnswerIssuesOf({ job, answer });
      if (issues.length > 0) return answerRefused(issues);
      job.answer = answer;
      return successResult({
        line: `Your verdict "${input.verdict}" is recorded. Stop now.`,
        data: { verdict: input.verdict },
      });
    },
  });
  registerGiveStartReview({ context, critics, refused: answerRefused, noJob });
}
