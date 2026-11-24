import type { PlanReview } from "@yumekit/project";
import type { PlanAnswer } from "./planAnswerInput.js";
import type { PlanJob } from "./planJob.js";

export function planReviewOf(options: {
  job: PlanJob;
  answer: PlanAnswer;
  seconds: number;
}): PlanReview {
  const { job, answer } = options;
  const findingFaults = answer.findings.flatMap((entry) => {
    const finding = job.findings[entry.index - 1];
    return entry.cause === "fault" && finding !== undefined
      ? [`${finding.text} ${entry.seen}`]
      : [];
  });
  return {
    verdict: answer.verdict,
    planKey: job.planKey,
    faults: [
      ...answer.faults,
      ...findingFaults,
      ...answer.cast.flatMap((entry) =>
        entry.faults.map((fault) => `"${entry.cast_id}": ${fault}`),
      ),
      ...answer.shots.flatMap((entry) =>
        entry.faults.map((fault) => `Shot "${entry.shot_id}": ${fault}`),
      ),
    ],
    notes: answer.notes,
    shots: answer.shots.map((entry) => ({
      shotId: entry.shot_id,
      difficulty: entry.difficulty,
      limits: entry.limits,
      faults: entry.faults,
      notes: entry.notes,
    })),
    cast: answer.cast.map((entry) => ({
      castId: entry.cast_id,
      faults: entry.faults,
      notes: entry.notes,
    })),
    easiestShotId: answer.easiest_shot_id,
    hardestShotId: answer.hardest_shot_id,
    seconds: Math.round(options.seconds),
  };
}
