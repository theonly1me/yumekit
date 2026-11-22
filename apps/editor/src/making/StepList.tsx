import type { MakingStep } from "./makingSteps.js";

function StepLine(props: { step: MakingStep }) {
  return (
    <>
      <span className="step-mark" aria-hidden="true" />
      <span>{props.step.label}</span>
      <em>{props.step.fact}</em>
    </>
  );
}

export function StepList(props: {
  steps: MakingStep[];
  openStepId: MakingStep["id"] | undefined;
  onOpen: (stepId: MakingStep["id"]) => void;
}) {
  return (
    <ol className="making-steps">
      {props.steps.map((step) => {
        const isOpen = step.id === props.openStepId;
        return (
          <li key={step.id} data-status={step.state} data-open={String(isOpen)}>
            {step.state === "done" ? (
              <button
                type="button"
                className="step-row"
                aria-pressed={isOpen}
                onClick={() => {
                  props.onOpen(step.id);
                }}
              >
                <StepLine step={step} />
                <span className="step-see">
                  {isOpen ? "Open now" : "See and change"}
                </span>
              </button>
            ) : (
              <span className="step-row">
                <StepLine step={step} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
