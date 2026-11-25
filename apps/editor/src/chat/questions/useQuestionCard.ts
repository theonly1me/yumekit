import { useState } from "react";
import type { ChatEntry } from "../chatSchemas.js";
import type { QuestionsEntry } from "./questionSchemas.js";
import {
  answerInputsOf,
  emptyAnswer,
  isAnswered,
  withChoice,
  withOwnWords,
  type AnswerInput,
  type CardAnswer,
} from "./roundAnswers.js";

export type QuestionCard = ReturnType<typeof useQuestionCard>;

interface CardState {
  roundId: string | undefined;
  index: number;
  answers: Record<string, CardAnswer>;
}

export function openRoundOf(entries: ChatEntry[]): QuestionsEntry | undefined {
  return entries.findLast(
    (entry): entry is QuestionsEntry =>
      entry.kind === "questions" && entry.state === "open",
  );
}

export function useQuestionCard(round: QuestionsEntry | undefined) {
  const [state, setState] = useState<CardState>({
    roundId: undefined,
    index: 0,
    answers: {},
  });
  if (state.roundId !== round?.id) {
    setState({ roundId: round?.id, index: 0, answers: {} });
  }
  const questions = round?.questions ?? [];
  const index = Math.min(state.index, Math.max(questions.length - 1, 0));
  const question = questions[index];
  const answer =
    question === undefined
      ? emptyAnswer
      : (state.answers[question.id] ?? emptyAnswer);
  const setAnswer = (next: CardAnswer) => {
    if (question === undefined) return;
    setState((current) => ({
      ...current,
      answers: { ...current.answers, [question.id]: next },
    }));
  };
  return {
    question,
    index,
    count: questions.length,
    answer,
    isLast: index === questions.length - 1,
    isComplete: questions.every((each) => isAnswered(state.answers[each.id])),
    choose: (option: string) => {
      if (question === undefined) return;
      setAnswer(withChoice({ question, answer, option }));
    },
    writeOwnWords: (ownWords: string) => {
      if (question === undefined) return;
      setAnswer(withOwnWords({ question, answer, ownWords }));
    },
    move: (step: -1 | 1) => {
      setState((current) => ({
        ...current,
        index: Math.min(Math.max(index + step, 0), questions.length - 1),
      }));
    },
    answersOf: (open: QuestionsEntry): AnswerInput[] =>
      answerInputsOf({ round: open, answers: state.answers }),
  };
}
