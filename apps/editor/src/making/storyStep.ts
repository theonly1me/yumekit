import type { Snapshot } from "../engine/snapshot.js";
import type { MakingStep } from "./makingSteps.js";

export function storyStepsOf(snapshot: Snapshot): MakingStep[] {
  const plan = snapshot.bible.storyPlan;
  if (plan === undefined) return [];
  const count = plan.shots.length;
  return [
    {
      id: "story",
      label: "Plan the story",
      state: "done",
      fact:
        count === 1
          ? "1 shot is planned"
          : `${String(count)} shots are planned`,
    },
  ];
}
