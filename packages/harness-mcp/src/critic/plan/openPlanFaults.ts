import type {
  Bible,
  CastMember,
  PlanReview,
  Shot,
  StoryPlan,
} from "@yumekit/project";
import type { PlanAnswer } from "./planAnswerInput.js";
import type { PlanJob } from "./planJob.js";

export const planCheckLimit = 2;

export interface OpenPlanFaults {
  shots: Map<string, string[]>;
  cast: Map<string, string[]>;
  plan: string[];
}

export function isPlanCheckUsedUp(plan: StoryPlan): boolean {
  return (plan.failedPlanChecks ?? 0) >= planCheckLimit;
}

export function openPlanFaultsOf(options: {
  job: PlanJob;
  answer: PlanAnswer;
}): OpenPlanFaults {
  const { job, answer } = options;
  const cast = new Map<string, string[]>(
    answer.cast.map((entry) => [entry.cast_id, entry.faults]),
  );
  answer.findings.forEach((entry) => {
    const finding = job.findings[entry.index - 1];
    if (entry.cause !== "fault" || finding === undefined) return;
    cast.set(finding.castId, [
      ...(cast.get(finding.castId) ?? []),
      `${finding.text} ${entry.seen}`,
    ]);
  });
  return {
    shots: new Map<string, string[]>(
      answer.shots.map((entry) => [entry.shot_id, entry.faults]),
    ),
    cast,
    plan: answer.faults,
  };
}

function shotWithNotes(options: { shot: Shot; notes: string[] }): Shot {
  const { planNotes, ...rest } = options.shot;
  if (options.notes.length > 0) return { ...rest, planNotes: options.notes };
  return planNotes === undefined ? options.shot : rest;
}

function memberWithNotes(options: {
  member: CastMember;
  notes: string[];
}): CastMember {
  const { planNotes, ...rest } = options.member;
  if (options.notes.length > 0) return { ...rest, planNotes: options.notes };
  return planNotes === undefined ? options.member : rest;
}

export function bibleAfterPlanCheck(options: {
  bible: Bible;
  plan: StoryPlan;
  review: PlanReview;
  open: OpenPlanFaults | undefined;
  costEstimateUsd: number;
}): Bible {
  const { bible, plan, review, open } = options;
  const failedPlanChecks =
    (plan.failedPlanChecks ?? 0) + (review.verdict === "fail" ? 1 : 0);
  const { planNotes, ...planRest } = plan;
  const notes = open?.plan ?? [];
  const planWithNotes =
    notes.length > 0
      ? { ...planRest, planNotes: notes }
      : planNotes === undefined
        ? plan
        : planRest;
  return {
    ...bible,
    cast: bible.cast.map((member) =>
      memberWithNotes({ member, notes: open?.cast.get(member.id) ?? [] }),
    ),
    storyPlan: {
      ...planWithNotes,
      shots: plan.shots.map((shot) =>
        shotWithNotes({ shot, notes: open?.shots.get(shot.id) ?? [] }),
      ),
      review,
      failedPlanChecks,
      costEstimateUsd: options.costEstimateUsd,
    },
  };
}
