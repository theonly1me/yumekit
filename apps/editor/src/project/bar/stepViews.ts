import type { TakeStep } from "../takes/takeSchema.js";
import { takesOfChapter } from "../takes/verdicts.js";
import type { ProjectFacts } from "../work/projectFacts.js";
import type { ViewChoice, WorkState } from "../work/workState.js";

export function shownStepOf(state: WorkState): TakeStep | undefined {
  switch (state.kind) {
    case "story":
      return "story";
    case "film":
      return "cut";
    case "making":
    case "take":
      return state.take.step;
    case "waiting":
    case "failed":
    case "empty":
      return undefined;
  }
}

export function viewOfStep(options: {
  facts: ProjectFacts;
  step: TakeStep;
}): ViewChoice {
  const { facts, step } = options;
  if (step === "story") return { kind: "story" };
  if (step === "cut") return { kind: "film" };
  const last = takesOfChapter({
    takes: facts.takes,
    chapterId: facts.chapterId,
  })
    .filter((take) => take.step === step)
    .at(-1);
  return last === undefined
    ? { kind: "auto" }
    : { kind: "take", takeId: last.id };
}
