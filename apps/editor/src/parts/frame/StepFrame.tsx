import type { ReactNode } from "react";
import "./parts.css";

export const lockedLine =
  "The AI still works on the video. You can look now. You can change this when the AI finishes, or after you stop it.";

export function StepFrame(props: {
  title: string;
  titleId: string;
  locked: boolean;
  onStop?: (() => void) | undefined;
  children: ReactNode;
}) {
  const { onStop } = props;
  return (
    <section
      className="part"
      data-locked={String(props.locked)}
      aria-labelledby={props.titleId}
    >
      <header className="part-head">
        <h2 id={props.titleId}>{props.title}</h2>
        {props.locked ? (
          <div className="part-note">
            <p className="fact">{lockedLine}</p>
            {onStop === undefined ? undefined : (
              <button type="button" onClick={onStop}>
                Stop
              </button>
            )}
          </div>
        ) : undefined}
      </header>
      <div className="part-body">{props.children}</div>
    </section>
  );
}
