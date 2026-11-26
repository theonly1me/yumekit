import type { TakeStep } from "../takes/takeSchema.js";
import type { RailStep } from "./railSteps.js";
import "./projectBar.css";

export function ProjectBar(props: {
  projectName: string;
  steps: RailStep[];
  shownStep: TakeStep | undefined;
  exportLabel: string;
  onStep: (step: TakeStep) => void;
  onEditByHand: () => void;
  onExport: () => void;
  onSettings: () => void;
}) {
  return (
    <header className="project-bar">
      <div className="identity">
        <p className="wordmark">yumekit</p>
        <p className="project-name">{props.projectName}</p>
      </div>
      <ol className="step-rail" aria-label="Steps of this chapter">
        {props.steps.map((step) => (
          <li key={step.step}>
            <button
              type="button"
              className="rail-step"
              data-status={step.status}
              aria-current={props.shownStep === step.step ? "step" : undefined}
              disabled={step.status === "next"}
              onClick={() => {
                props.onStep(step.step);
              }}
            >
              {step.label}
            </button>
          </li>
        ))}
      </ol>
      <div className="bar-actions">
        <button type="button" onClick={props.onEditByHand}>
          Edit by hand
        </button>
        <button type="button" onClick={props.onExport}>
          {props.exportLabel}
        </button>
        <button type="button" onClick={props.onSettings}>
          Settings
        </button>
      </div>
    </header>
  );
}
