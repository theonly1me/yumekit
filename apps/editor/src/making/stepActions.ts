import { sendFixedRequest, type AskTheAi } from "../parts/fixedRequests.js";
import type { MakingStep } from "./makingSteps.js";
import type { StepAction } from "./stepReasons.js";

export function runStepAction(options: {
  action: StepAction;
  stepId: MakingStep["id"];
  openStep: (stepId: MakingStep["id"]) => void;
  ask: AskTheAi;
  onOpenEditor: () => void;
}): void {
  const { action, ask } = options;
  if (action === "add-a-key" || action === "use-my-own-music") {
    options.openStep("music");
    return;
  }
  const request =
    action === "try-again" &&
    (options.stepId === "voice" || options.stepId === "music")
      ? { kind: "try-the-step-again" as const, part: options.stepId }
      : { kind: "make-the-rest" as const };
  sendFixedRequest({ ask, request })
    .then((isSent) => {
      if (isSent) options.onOpenEditor();
    })
    .catch(() => undefined);
}
