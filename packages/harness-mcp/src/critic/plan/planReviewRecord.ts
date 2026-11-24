import type { PlanBriefFault, PlanReview } from "@yumekit/project";
import type { PlanAnswer } from "./planAnswerInput.js";
import type { PlanJob } from "./planJob.js";

export function briefFaultText(fault: PlanBriefFault): string {
  return `The brief fact of "${fault.castId}"${fault.shotId === undefined ? "" : ` in shot "${fault.shotId}"`}: "${fault.briefFact}". ${fault.seen} Restore: "${fault.restore}".`;
}

function briefFaultsOf(answer: PlanAnswer): PlanBriefFault[] {
  return (answer.brief_faults ?? []).map((fault) => ({
    castId: fault.cast_id,
    ...(fault.shot_id === undefined ? {} : { shotId: fault.shot_id }),
    briefFact: fault.brief_fact,
    restore: fault.restore,
    seen: fault.seen,
  }));
}

export function planReviewOf(options: {
  job: PlanJob;
  answer: PlanAnswer;
  seconds: number;
}): PlanReview {
  const { job, answer } = options;
  const briefFaults = briefFaultsOf(answer);
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
      ...briefFaults.map(briefFaultText),
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
    ...(briefFaults.length === 0 ? {} : { briefFaults }),
    easiestShotId: answer.easiest_shot_id,
    hardestShotId: answer.hardest_shot_id,
    seconds: Math.round(options.seconds),
  };
}
