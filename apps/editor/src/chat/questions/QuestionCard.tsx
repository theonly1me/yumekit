import { useId } from "react";
import type { QuestionCard as Card } from "./useQuestionCard.js";
import "./questions.css";

export function QuestionCard(props: {
  card: Card;
  isSending: boolean;
  onSend: () => void;
}) {
  const { card } = props;
  const ownWordsId = useId();
  const hintId = useId();
  const { question } = card;
  if (question === undefined) return undefined;
  const canSend = card.isComplete && !props.isSending;
  const goOn = () => {
    if (!card.isLast) card.move(1);
    else if (canSend) props.onSend();
  };
  return (
    <section className="question-card" aria-label="Questions from the AI">
      <p className="question-count">
        Question {card.index + 1} of {card.count}
        {question.multiple ? ". Pick one or more." : ""}
      </p>
      <p className="question-text">{question.text}</p>
      <div className="option-chips" role="group" aria-label={question.text}>
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            className="option-chip"
            aria-pressed={card.answer.choices.includes(option)}
            onClick={() => {
              card.choose(option);
            }}
          >
            {option}
          </button>
        ))}
      </div>
      <label htmlFor={ownWordsId} className="hidden-label">
        Your own answer
      </label>
      <input
        id={ownWordsId}
        type="text"
        className="own-words"
        placeholder={
          question.multiple ? "Or add your own words" : "Or in your own words"
        }
        value={card.answer.ownWords}
        onChange={(event) => {
          card.writeOwnWords(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
          event.preventDefault();
          goOn();
        }}
      />
      {card.isLast && !card.isComplete ? (
        <p className="question-hint" id={hintId}>
          Answer each question to send them. Or write in the box below: your
          message goes with the answers you gave.
        </p>
      ) : undefined}
      <div className="question-nav">
        <button
          type="button"
          disabled={card.index === 0}
          onClick={() => {
            card.move(-1);
          }}
        >
          Back
        </button>
        {card.isLast ? (
          <button
            type="button"
            className="primary"
            disabled={!canSend}
            aria-describedby={card.isComplete ? undefined : hintId}
            onClick={props.onSend}
          >
            Send my answers
          </button>
        ) : (
          <button
            type="button"
            className="primary"
            onClick={() => {
              card.move(1);
            }}
          >
            Next
          </button>
        )}
      </div>
    </section>
  );
}
