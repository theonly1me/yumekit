import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { HarnessContext } from "../../context.js";
import {
  failureResult,
  successResult,
  type HarnessFailure,
} from "../../results.js";
import type { CriticDesk } from "../criticDesk.js";
import { designIssuesOf } from "../design/designAnswer.js";
import { listAnswerIssuesOf, sheetAnswerInput } from "../sheet/sheetJob.js";
import { startListItems } from "./startJob.js";

export function registerGiveStartReview(options: {
  context: HarnessContext;
  critics: CriticDesk;
  refused: (issues: string[]) => CallToolResult;
  noJob: HarnessFailure;
}): void {
  const { critics } = options;
  options.context.tools.add({
    name: "give_start_review",
    description:
      "For the critic only: your whole answer about a start picture. Answer each item of the list, the counts, the verdict, the blocking faults, and the notes.",
    inputSchema: sheetAnswerInput,
    run: ({ input, reviewJobId }) => {
      const job = critics.jobOf(reviewJobId);
      if (job?.kind !== "start") return failureResult(options.noJob);
      const issues = [
        ...listAnswerIssuesOf({
          itemCount: startListItems.length,
          answer: input,
        }),
        ...designIssuesOf({ job: job.design, frames: input.design }),
      ];
      if (issues.length > 0) return options.refused(issues);
      job.answer = input;
      return successResult({
        line: `Your verdict "${input.verdict}" is recorded. Stop now.`,
        data: { verdict: input.verdict },
      });
    },
  });
}
