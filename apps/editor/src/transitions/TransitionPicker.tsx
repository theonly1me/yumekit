import { useEffect, useRef } from "react";
import { TransitionIcon } from "./TransitionIcon.js";
import {
  transitionChoices,
  type TransitionChoice,
} from "./transitionChoices.js";
import "./transitions.css";

export function TransitionPicker(props: {
  label: string;
  current: TransitionChoice | undefined;
  disabled?: boolean;
  focusOnOpen?: boolean;
  onPick: (kind: TransitionChoice) => void;
}) {
  const group = useRef<HTMLDivElement>(null);
  const { focusOnOpen } = props;

  useEffect(() => {
    if (focusOnOpen !== true) return;
    group.current
      ?.querySelector<HTMLButtonElement>('[aria-pressed="true"], button')
      ?.focus();
  }, [focusOnOpen]);

  return (
    <div
      className="transition-picker"
      role="group"
      aria-label={props.label}
      ref={group}
    >
      {transitionChoices.map((choice) => (
        <button
          key={choice.kind}
          type="button"
          className="transition-choice"
          aria-pressed={choice.kind === props.current}
          disabled={props.disabled}
          title={choice.line}
          onClick={() => {
            props.onPick(choice.kind);
          }}
        >
          <TransitionIcon kind={choice.kind} />
          <span>{choice.name}</span>
        </button>
      ))}
    </div>
  );
}
