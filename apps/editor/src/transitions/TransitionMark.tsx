import { TransitionIcon } from "./TransitionIcon.js";
import { nameOf, type TransitionChoice } from "./transitionChoices.js";
import "./transitions.css";

export function TransitionMark(props: {
  kind: TransitionChoice;
  nextNumber: number;
  isOpen: boolean;
  onOpen: () => void;
}) {
  const name = nameOf(props.kind);
  return (
    <button
      type="button"
      className="transition-mark"
      data-kind={props.kind}
      aria-expanded={props.isOpen}
      aria-label={`Change how scene ${String(props.nextNumber)} comes in. Now: ${name}`}
      title={`Into scene ${String(props.nextNumber)}: ${name}`}
      onClick={props.onOpen}
    >
      <TransitionIcon kind={props.kind} />
    </button>
  );
}
