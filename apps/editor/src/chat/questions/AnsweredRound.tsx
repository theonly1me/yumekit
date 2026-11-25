import type { QuestionsEntry } from "./questionSchemas.js";
import { answeredLineOf, answerTextOf } from "./roundAnswers.js";
import "./questions.css";

export function AnsweredRound(props: { round: QuestionsEntry }) {
  const { round } = props;
  return (
    <details className="answered-round">
      <summary>{answeredLineOf(round)}</summary>
      <ul className="answer-list">
        {round.questions.map((question) => (
          <li key={question.id}>
            <span>{question.text}</span>
            {answerTextOf({ round, questionId: question.id })}
          </li>
        ))}
      </ul>
    </details>
  );
}
