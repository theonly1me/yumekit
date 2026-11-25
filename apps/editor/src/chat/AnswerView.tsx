import type { AnswerEntry } from "./chatSchemas.js";
import { MarkdownText } from "./markdown/MarkdownText.js";
import { stepLinesOf } from "./stepLines.js";

const stateLabels: Partial<Record<AnswerEntry["state"], string>> = {
  stopped: "Stopped",
};

export function madeWithTextOf(
  madeWith: NonNullable<AnswerEntry["madeWith"]>,
): string {
  const model =
    madeWith.model === undefined
      ? "its own model"
      : `the model ${madeWith.model}`;
  const effort =
    madeWith.effort === undefined
      ? "its own effort"
      : `${madeWith.effort} effort`;
  return `${madeWith.program} with ${model} and ${effort}`;
}

function isKnown(
  madeWith: AnswerEntry["madeWith"],
): madeWith is NonNullable<AnswerEntry["madeWith"]> {
  return madeWith?.model !== undefined || madeWith?.effort !== undefined;
}

export function AnswerView(props: { answer: AnswerEntry; text: string }) {
  const { answer, text } = props;
  const isRunning = answer.state === "running";
  const lines = isRunning ? stepLinesOf(answer.steps) : [];
  const isEmpty = text === "" && lines.length === 0;
  const label = stateLabels[answer.state];
  const madeWith = isKnown(answer.madeWith) ? answer.madeWith : undefined;
  if (!isRunning && text === "" && label === undefined) return undefined;
  return (
    <li className="entry ai" data-state={answer.state}>
      <span className="who">AI</span>
      <div className="answer-body">
        {isRunning && isEmpty ? (
          <p className="thinking">Working on it</p>
        ) : undefined}
        {text === "" ? undefined : (
          <MarkdownText className="answer-text" text={text} />
        )}
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
        {madeWith === undefined ? undefined : (
          <p className="made-with">{madeWithTextOf(madeWith)}</p>
        )}
      </div>
    </li>
  );
}
