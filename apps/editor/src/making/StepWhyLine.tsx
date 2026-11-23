import type { StepAction, StepWhy } from "./stepReasons.js";

export const stepActionLabels: Record<StepAction, string> = {
  "add-a-key": "Add a key",
  "use-my-own-music": "Use my own music",
  "make-the-rest": "Make the rest",
  "try-again": "Try again",
};

export function StepWhyLine(props: {
  why: StepWhy;
  onAction: (action: StepAction) => void;
}) {
  const { why } = props;
  return (
    <div className="step-why">
      <p>{why.text}</p>
      {why.actions.length === 0 ? undefined : (
        <div className="step-why-actions">
          {why.actions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => {
                props.onAction(action);
              }}
            >
              {stepActionLabels[action]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
