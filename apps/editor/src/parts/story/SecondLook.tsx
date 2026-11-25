import { useState } from "react";
import type { AskTheAi } from "../fixedRequests.js";

type LookState = "idle" | "sending" | "sent" | "failed";

const stateTexts: Record<LookState, string | undefined> = {
  idle: undefined,
  sending: "Asking the AI…",
  sent: "Asked. The answer comes in the chat.",
  failed: "The request did not start. Try again in a moment.",
};

export function SecondLook(props: {
  ask: AskTheAi;
  shotId: string;
  number: number;
  hasClip: boolean;
}) {
  const [state, setState] = useState<LookState>("idle");
  const what = props.hasClip ? "its clip" : "its first picture";
  const askForLook = () => {
    setState("sending");
    props
      .ask({
        text: `Please give shot ${String(props.number)} a second look.`,
        details: `Ask the critic for a second look at shot "${props.shotId}": review_start for its start picture${props.hasClip ? " and review_clip for its clip" : ""}. Then tell me in plain words what the critic found and what you suggest.`,
        aboutClipId: undefined,
      })
      .then(
        (isSent) => {
          setState(isSent ? "sent" : "failed");
        },
        () => {
          setState("failed");
        },
      );
  };
  const stateText = stateTexts[state];
  return (
    <div className="second-look">
      <button
        type="button"

        disabled={state === "sending"}
        aria-label={`Ask for a second look at shot ${String(props.number)}`}
        onClick={askForLook}
      >
        Ask for a second look
      </button>
      {stateText === undefined ? (
        <span className="fact">A second AI looks at {what}.</span>
      ) : (
        <span className="fact" role={state === "failed" ? "alert" : "status"}>
          {stateText}
        </span>
      )}
    </div>
  );
}
