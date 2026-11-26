import { startFailureOf } from "../../making/firstRequestFailure.js";
import type { WaitingPhase } from "./workState.js";

const phases: Record<WaitingPhase, { title: string; line: string }> = {
  reading: {
    title: "The lead reads your request",
    line: "It asks you a few questions in the chat, a round at a time. Answer them there, then it writes the whole story.",
  },
  questions: {
    title: "The lead has questions for you",
    line: "Answer them in the chat. Then the lead writes the whole story for you to read.",
  },
  working: {
    title: "The lead is at work",
    line: "It tells you in the chat what it does. Its next take shows here when it is ready.",
  },
};

export function WaitView(props: { phase: WaitingPhase; requestText: string }) {
  const phase = phases[props.phase];
  return (
    <div className="work-wait">
      <h2 className="work-title">{phase.title}</h2>
      <p className="fact lead">{phase.line}</p>
      {props.phase === "questions" ? undefined : (
        <div className="progress wide" data-moving="true">
          <i />
        </div>
      )}
      {props.requestText === "" ? undefined : (
        <blockquote className="work-request">{props.requestText}</blockquote>
      )}
    </div>
  );
}

export function FailedView(props: { failureKind: string }) {
  const failure = startFailureOf(props.failureKind);
  return (
    <div className="work-wait" role="alert">
      <h2 className="work-title">{failure.title}</h2>
      {failure.lines.map((line) => (
        <p key={line} className="fact lead">
          {line}
        </p>
      ))}
    </div>
  );
}

export function EmptyView() {
  return (
    <div className="work-wait">
      <h2 className="work-title">Nothing made yet</h2>
      <p className="fact lead">
        Tell the lead what to make in the chat. Each round of pictures, clips,
        and the cut shows here, one at a time.
      </p>
    </div>
  );
}
