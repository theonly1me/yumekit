import { useState } from "react";

function factOf(options: { isRunning: boolean; isPlanReady: boolean }) {
  if (options.isRunning) {
    return "You can stop at any time. What is made stays in the project.";
  }
  return options.isPlanReady
    ? "Or open the editor now, and ask the AI in the chat to make the rest later."
    : "Or open a step to check it first.";
}

export function MakingActions(props: {
  isRunning: boolean;
  isPlanReady: boolean;
  hasScene: boolean;
  onStop: () => void;
  onOpenEditor: () => void;
  onContinue: () => Promise<boolean>;
}) {
  const [continueState, setContinueState] = useState<
    "idle" | "sending" | "failed"
  >("idle");
  const isMainOpen = !props.isRunning && !props.isPlanReady;
  return (
    <div className="making-action">
      {props.isRunning ? (
        <button type="button" onClick={props.onStop}>
          Stop
        </button>
      ) : undefined}
      {props.isPlanReady ? (
        <button
          type="button"
          className="primary large"
          disabled={continueState === "sending"}
          aria-busy={continueState === "sending"}
          onClick={() => {
            setContinueState("sending");
            props
              .onContinue()
              .then((isSent) => {
                setContinueState(isSent ? "idle" : "failed");
              })
              .catch(() => {
                setContinueState("failed");
              });
          }}
        >
          Continue
        </button>
      ) : undefined}
      {props.hasScene || !props.isRunning ? (
        <button
          type="button"
          className={isMainOpen ? "primary large" : undefined}
          onClick={props.onOpenEditor}
        >
          Open the editor
        </button>
      ) : undefined}
      <p className="fact">{factOf(props)}</p>
      {continueState === "failed" ? (
        <p className="fact change-failure" role="alert">
          The request did not start. Try again in a moment.
        </p>
      ) : undefined}
    </div>
  );
}
