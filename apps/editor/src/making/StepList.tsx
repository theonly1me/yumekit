import type { MakingStep } from "./makingSteps.js";
import { StepWhyLine } from "./StepWhyLine.js";
import type { StepAction } from "./stepReasons.js";

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
  onAction: (choice: { stepId: MakingStep["id"]; action: StepAction }) => void;
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
            {step.progress === undefined ? undefined : (
              <div className="step-why" role="status">
                <p>
                  {step.progress.percent === undefined
                    ? step.progress.line
                    : `${step.progress.line}: ${String(step.progress.percent)} percent`}
                </p>
                <span
                  className="step-progress"
                  data-known={String(step.progress.percent !== undefined)}
                >
                  <span
                    style={{ width: `${String(step.progress.percent ?? 30)}%` }}
                  />
                </span>
              </div>
            )}
            {step.why === undefined ? undefined : (
              <StepWhyLine
                why={step.why}
                onAction={(action) => {
                  props.onAction({ stepId: step.id, action });
                }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
