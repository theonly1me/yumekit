import type { StoryPlan } from "@yumekit/project";
import { plainText } from "../../storyPlan/briefFaultGate.js";
import type { PlanAnswer } from "./planAnswerInput.js";

function escaped(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function namedShotIdsOf(options: {
  text: string;
  plan: StoryPlan;
}): string[] {
  const { text, plan } = options;
  const byNumber = [
    ...text.matchAll(/\bshots?\s+(\d+)((?:\s*(?:,|and)\s*\d+)*)/gi),
  ]
    .flatMap(
      (match) => `${match[1] ?? ""} ${match[2] ?? ""}`.match(/\d+/g) ?? [],
    )
    .flatMap((number) => {
      const shot = plan.shots[Number(number) - 1];
      return shot === undefined ? [] : [shot.id];
    });
  const byId = plan.shots
    .filter((shot) =>
      new RegExp(
        `\\bshot\\s+(?:\\d+\\s+)?["'“‘]?${escaped(shot.id)}(?![a-z0-9-])`,
        "i",
      ).test(text),
    )
    .map((shot) => shot.id);
  return [...new Set([...byNumber, ...byId])];
}

export function withoutRepeatedFaults(options: {
  plan: StoryPlan;
  answer: PlanAnswer;
}): PlanAnswer {
  const { plan, answer } = options;
  const faulted = new Set(
    answer.shots
      .filter((entry) => entry.faults.length > 0)
      .map((entry) => entry.shot_id),
  );
  const seen = new Set<string>();
  const faults = answer.faults.filter((fault) => {
    const key = plainText(fault);
    if (seen.has(key)) return false;
    seen.add(key);
    const named = namedShotIdsOf({ text: fault, plan });
    return named.length === 0 || named.some((id) => !faulted.has(id));
  });
  return {
    ...answer,
    faults,
    shots: answer.shots.map((entry) => ({
      ...entry,
      faults: [...new Set(entry.faults)],
    })),
  };
}

export function shotFaultsInPlanFaults(options: {
  plan: StoryPlan;
  answer: PlanAnswer;
}): string[] {
  return options.answer.faults.flatMap((fault) =>
    namedShotIdsOf({ text: fault, plan: options.plan }).map(
      (id) =>
        `A fault of the whole plan names shot "${id}": put it in the entry of that shot, once. "${fault.slice(0, 80)}"`,
    ),
  );
}
