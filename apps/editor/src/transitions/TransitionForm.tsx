import { TransitionPicker } from "./TransitionPicker.js";
import type { TransitionChoice } from "./transitionChoices.js";

export function TransitionForm(props: {
  nextNumber: number;
  current: TransitionChoice;
  onPick: (kind: TransitionChoice) => void;
  onClose: () => void;
}) {
  const title = `How scene ${String(props.nextNumber)} comes in`;
  return (
    <div
      className="transition-form"
      onKeyDown={(event) => {
        if (event.key === "Escape") props.onClose();
      }}
    >
      <p className="transition-form-title">{title}</p>
      <TransitionPicker
        label={title}
        current={props.current}
        focusOnOpen
        onPick={props.onPick}
      />
      <button type="button" onClick={props.onClose}>
        Close
      </button>
    </div>
  );
}
