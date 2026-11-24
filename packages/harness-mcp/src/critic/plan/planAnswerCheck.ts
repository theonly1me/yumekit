import { plainText } from "../../storyPlan/briefFaultGate.js";
import type { PlanAnswer } from "./planAnswerInput.js";
import { shotFaultsInPlanFaults } from "./repeatedFaults.js";
import { planListItems, type PlanJob } from "./planJob.js";

type Issue = string | undefined;

export const blockingFaultsForOneShot = 3;

function briefIssues(options: { job: PlanJob; answer: PlanAnswer }): Issue[] {
  const { job, answer } = options;
  return (answer.brief_faults ?? []).map((fault) => {
    const member = job.members.find((entry) => entry.id === fault.cast_id);
    if (member === undefined) {
      return `brief_faults names "${fault.cast_id}", which is not a cast entry of the plan.`;
    }
    if (
      !(member.briefFacts ?? []).some(
        (fact) => plainText(fact) === plainText(fault.brief_fact),
      )
    ) {
      return `"${fault.brief_fact}" is not a fact of the brief of "${member.id}". Copy its exact words, or put the fault in faults or notes.`;
    }
    return fault.shot_id === undefined ||
      job.plan.shots.some((shot) => shot.id === fault.shot_id)
      ? undefined
      : `brief_faults names the shot "${fault.shot_id}", which the plan does not have.`;
  });
}

function capIssues(answer: PlanAnswer): Issue[] {
  return answer.shots.map((entry) => {
    const count =
      entry.faults.length +
      (answer.brief_faults ?? []).filter(
        (fault) => fault.shot_id === entry.shot_id,
      ).length;
    return count > blockingFaultsForOneShot
      ? `Shot "${entry.shot_id}" has ${String(count)} blocking faults. Keep at most ${String(blockingFaultsForOneShot)}, the ones most likely to fail, and move the rest to notes.`
      : undefined;
  });
}

function coverageIssues(options: {
  job: PlanJob;
  answer: PlanAnswer;
}): Issue[] {
  const { job, answer } = options;
  const items = new Set(answer.checks.map((check) => check.item));
  const findings = new Set(answer.findings.map((entry) => entry.index));
  const shotIds = answer.shots.map((entry) => entry.shot_id);
  const castIds = answer.cast.map((entry) => entry.cast_id);
  const planShotIds = job.plan.shots.map((shot) => shot.id);
  return [
    ...planListItems.map((...[, index]) =>
      items.has(index + 1)
        ? undefined
        : `Answer item ${String(index + 1)} of the list in checks.`,
    ),
    ...job.findings.map((...[, index]) =>
      findings.has(index + 1)
        ? undefined
        : `Answer finding ${String(index + 1)} in findings.`,
    ),
    ...planShotIds.map((id) =>
      shotIds.filter((candidate) => candidate === id).length === 1
        ? undefined
        : `Give exactly one entry for shot "${id}" in shots.`,
    ),
    ...shotIds.map((id) =>
      planShotIds.includes(id) ? undefined : `The plan has no shot "${id}".`,
    ),
    ...job.members.map((member) =>
      castIds.includes(member.id)
        ? undefined
        : `Give an entry for "${member.id}" in cast.`,
    ),
  ];
}

function blockingCountOf(answer: PlanAnswer): number {
  return (
    answer.faults.length +
    answer.shots.reduce((...[total, entry]) => total + entry.faults.length, 0) +
    answer.cast.reduce((...[total, entry]) => total + entry.faults.length, 0) +
    answer.findings.filter((entry) => entry.cause === "fault").length +
    (answer.brief_faults ?? []).length
  );
}

function calibrationIssues(answer: PlanAnswer): Issue[] {
  const byId = new Map(
    answer.shots.map((entry) => [entry.shot_id, entry.difficulty] as const),
  );
  const easiest = byId.get(answer.easiest_shot_id);
  const hardest = byId.get(answer.hardest_shot_id);
  const values = [...byId.values()];
  return [
    easiest === undefined
      ? `easiest_shot_id "${answer.easiest_shot_id}" is not a shot of your answer.`
      : easiest > Math.min(...values)
        ? "The easiest shot has the lowest difficulty."
        : undefined,
    hardest === undefined
      ? `hardest_shot_id "${answer.hardest_shot_id}" is not a shot of your answer.`
      : hardest < Math.max(...values)
        ? "The hardest shot has the highest difficulty."
        : undefined,
    answer.shots.length > 1 && answer.easiest_shot_id === answer.hardest_shot_id
      ? "Name two different shots as the easiest and the hardest."
      : undefined,
  ];
}

export function planAnswerIssuesOf(options: {
  job: PlanJob;
  answer: PlanAnswer;
}): string[] {
  const { answer } = options;
  const blocking = blockingCountOf(answer);
  const verdictIssue =
    answer.verdict === "pass" && blocking > 0
      ? "A pass has no blocking fault and no finding that is a fault. Move a small thing to notes, or give fail."
      : answer.verdict === "fail" && blocking === 0
        ? "A fail names at least one blocking fault."
        : undefined;
  return [
    ...coverageIssues(options),
    ...calibrationIssues(answer),
    ...briefIssues(options),
    ...capIssues(answer),
    ...shotFaultsInPlanFaults({ plan: options.job.plan, answer }),
    verdictIssue,
  ].flatMap((issue) => (issue === undefined ? [] : [issue]));
}
