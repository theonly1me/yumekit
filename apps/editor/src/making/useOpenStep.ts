import { useState } from "react";
import type { MakingStep } from "./makingSteps.js";

type StepId = MakingStep["id"];

interface OpenState {
  stepId: StepId | undefined;
  hasOpenedFirst: boolean;
}

export function useOpenStep(steps: MakingStep[]) {
  const [open, setOpen] = useState<OpenState>({
    stepId: undefined,
    hasOpenedFirst: false,
  });
  const firstDone = steps.find((step) => step.state === "done");
  if (!open.hasOpenedFirst && firstDone !== undefined) {
    setOpen({ stepId: open.stepId ?? firstDone.id, hasOpenedFirst: true });
  }
  return {
    stepId: open.stepId,
    openStep: (stepId: StepId) => {
      setOpen({ stepId, hasOpenedFirst: true });
    },
  };
}
