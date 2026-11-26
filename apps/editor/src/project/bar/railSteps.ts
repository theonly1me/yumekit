import type { Take, TakeStep } from "../takes/takeSchema.js";
import { takesOfChapter } from "../takes/verdicts.js";

export type RailStatus = "done" | "now" | "next";

export interface RailStep {
  step: TakeStep;
  label: string;
  status: RailStatus;
}

const labels: Record<TakeStep, string> = {
  story: "Story",
  pictures: "Pictures",
  clips: "Clips",
  cut: "Cut",
};

export function stepsOfFilm(hasAiVideo: boolean): TakeStep[] {
  return hasAiVideo ? ["story", "pictures", "clips", "cut"] : ["story", "cut"];
}

function isAllGood(take: Take): boolean {
  return take.state === "sent" && take.notes.length === 0;
}

export function currentStepOf(options: {
  takes: readonly Take[];
  chapterId: string;
  steps: TakeStep[];
  isStoryApproved: boolean;
}): TakeStep | "done" {
  const { steps } = options;
  if (!options.isStoryApproved) return "story";
  const newest = takesOfChapter(options).at(-1);
  const firstMade = steps[1] ?? "cut";
  if (newest === undefined) return firstMade;
  if (!isAllGood(newest)) return newest.step;
  const index = steps.indexOf(newest.step);
  return steps[index + 1] ?? "done";
}

export function railStepsOf(options: {
  takes: readonly Take[];
  chapterId: string;
  hasAiVideo: boolean;
  isStoryApproved: boolean;
}): RailStep[] {
  const steps = stepsOfFilm(options.hasAiVideo);
  const current = currentStepOf({ ...options, steps });
  const currentIndex =
    current === "done" ? steps.length : steps.indexOf(current);
  return steps.map((...[step, index]) => ({
    step,
    label: labels[step],
    status:
      index < currentIndex ? "done" : index === currentIndex ? "now" : "next",
  }));
}
