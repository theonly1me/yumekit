import type { Question, QuestionsEntry } from "./questionSchemas.js";

export interface CardAnswer {
  choices: string[];
  ownWords: string;
}

export interface AnswerInput {
  questionId: string;
  choices: string[];
  ownWords: string;
}

export const emptyAnswer: CardAnswer = { choices: [], ownWords: "" };

export function isAnswered(answer: CardAnswer | undefined): boolean {
  if (answer === undefined) return false;
  return answer.choices.length > 0 || answer.ownWords.trim() !== "";
}

export function withChoice(options: {
  question: Question;
  answer: CardAnswer;
  option: string;
}): CardAnswer {
  const { question, answer, option } = options;
  const isChosen = answer.choices.includes(option);
  if (!question.multiple) {
    return isChosen
      ? { ...answer, choices: [] }
      : { choices: [option], ownWords: "" };
  }
  return {
    ...answer,
    choices: isChosen
      ? answer.choices.filter((choice) => choice !== option)
      : question.options.filter(
          (candidate) =>
            candidate === option || answer.choices.includes(candidate),
        ),
  };
}

export function withOwnWords(options: {
  question: Question;
  answer: CardAnswer;
  ownWords: string;
}): CardAnswer {
  const { question, answer, ownWords } = options;
  return {
    choices: question.multiple || ownWords.trim() === "" ? answer.choices : [],
    ownWords,
  };
}

export function answerInputsOf(options: {
  round: QuestionsEntry;
  answers: Record<string, CardAnswer>;
}): AnswerInput[] {
  return options.round.questions.flatMap((question) => {
    const answer = options.answers[question.id];
    return answer !== undefined && isAnswered(answer)
      ? [
          {
            questionId: question.id,
            choices: answer.choices,
            ownWords: answer.ownWords.trim(),
          },
        ]
      : [];
  });
}

function storedAnswerOf(options: {
  round: QuestionsEntry;
  questionId: string;
}): CardAnswer | undefined {
  const answer = options.round.answers.find(
    (candidate) => candidate.questionId === options.questionId,
  );
  return isAnswered(answer) ? answer : undefined;
}

export function answerTextOf(options: {
  round: QuestionsEntry;
  questionId: string;
}): string {
  const answer = storedAnswerOf(options);
  if (answer === undefined) return "No answer";
  return [...answer.choices, answer.ownWords.trim()]
    .filter((part) => part !== "")
    .join(", ");
}

export function answeredLineOf(round: QuestionsEntry): string {
  const total = round.questions.length;
  const answered = round.questions.filter(
    (question) =>
      storedAnswerOf({ round, questionId: question.id }) !== undefined,
  ).length;
  const questions = total === 1 ? "question" : "questions";
  if (answered === total) {
    return total === 1
      ? "You answered 1 question"
      : `You answered ${String(total)} questions`;
  }
  if (answered === 0) return `You did not answer the ${questions}`;
  return `You answered ${String(answered)} of ${String(total)} questions`;
}
