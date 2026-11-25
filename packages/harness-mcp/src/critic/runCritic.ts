import type { HarnessFailure, Outcome } from "../results.js";
import type { WorkTicket } from "../work/board/workBoard.js";
import type { CriticDesk, CriticJob } from "./criticDesk.js";
import { noCriticFailure, type AskCritic } from "./criticTypes.js";

export async function runCritic(options: {
  askCritic: AskCritic | undefined;
  critics: CriticDesk;
  ticket: WorkTicket;
  job: CriticJob;
  brief: string;
  subject: string;
}): Promise<Outcome<{ seconds: number; costUsd?: number }, HarnessFailure>> {
  const { askCritic, job } = options;
  if (askCritic === undefined) return { ok: false, failure: noCriticFailure };
  const turn = await options.critics.run({
    job,
    work: (jobId) => {
      options.ticket.update({ state: "running" });
      return askCritic({
        brief: options.brief,
        subject: options.subject,
        jobId,
      });
    },
  });
  if (!turn.ok) return { ok: false, failure: turn.failure };
  if (job.answer === undefined) {
    return {
      ok: false,
      failure: {
        kind: "critic-failed",
        message: `The critic looked at ${options.subject} but gave no whole answer.`,
        hint: "Call the review again. Use nothing that has no review.",
      },
    };
  }
  return {
    ok: true,
    value: {
      seconds: turn.seconds,
      ...(turn.costUsd === undefined ? {} : { costUsd: turn.costUsd }),
    },
  };
}
