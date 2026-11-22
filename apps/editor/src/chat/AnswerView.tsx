import type { AnswerEntry } from "./chatSchemas.js";
import { stepLinesOf } from "./stepLines.js";

const stateLabels: Partial<Record<AnswerEntry["state"], string>> = {
  stopped: "Stopped",
};

export function AnswerView(props: { answer: AnswerEntry; text: string }) {
  const { answer, text } = props;
  const isRunning = answer.state === "running";
  const lines = isRunning ? stepLinesOf(answer.steps) : [];
  const isEmpty = text === "" && lines.length === 0;
  const label = stateLabels[answer.state];
  if (!isRunning && text === "" && label === undefined) return undefined;
  return (
    <li className="entry ai" data-state={answer.state}>
      <span className="who">AI</span>
      <div className="answer-body">
        {isRunning && isEmpty ? (
          <p className="thinking">Working on it</p>
        ) : undefined}
        {text === "" ? undefined : <p className="answer-text">{text}</p>}
        {lines.length === 0 ? undefined : (
          <ul className="steps" aria-label="Steps">
            {lines.map((line) => (
              <li key={line.key} data-state={line.state}>
                {line.text}
              </li>
            ))}
          </ul>
        )}
        {label === undefined ? undefined : <p className="fact">{label}</p>}
      </div>
    </li>
  );
}
