import type {
  PersonAnswer,
  QuestionsEntry,
  RequestFile,
} from "./questionSchemas.js";

const kindWords: Record<RequestFile["kind"], string> = {
  image: "a picture",
  audio: "a sound",
  video: "a video",
  font: "a font",
};

export function filesTextOf(files: RequestFile[]): string {
  if (files.length === 0) return "";
  const count = files.length === 1 ? "a file" : `${String(files.length)} files`;
  return [
    `The person added ${count} to this message. Each file is an asset of the project now. Look at each picture and video with preview_assets before you use it.`,
    ...files.map(
      (file) =>
        `- ${file.name}: ${kindWords[file.kind]}, asset id ${file.assetId}`,
    ),
  ].join("\n");
}

export function isAnswered(answer: PersonAnswer): boolean {
  return answer.choices.length > 0 || answer.ownWords.trim() !== "";
}

function answerLineOf(answer: PersonAnswer | undefined): string {
  if (answer === undefined) return "No answer.";
  const ownWords = answer.ownWords.trim();
  const parts = [
    ...(answer.choices.length === 0 ? [] : [answer.choices.join("; ")]),
    ...(ownWords === "" ? [] : [`In their own words: ${ownWords}`]),
  ];
  return `Answer: ${parts.join(". ")}`;
}

function headOf(options: { answered: number; total: number }): string {
  const { answered, total } = options;
  const questions =
    total === 1 ? "your question" : `your ${String(total)} questions`;
  if (answered === total) return `The person answered ${questions}:`;
  if (answered === 0) {
    return `The person did not answer ${questions}. Each one is still open:`;
  }
  return `The person answered ${String(answered)} of ${questions}. A question with no answer is still open:`;
}

export function answersTextOf(options: {
  round: QuestionsEntry;
  answers: PersonAnswer[];
}): string {
  const answerOf = (questionId: string) =>
    options.answers.find(
      (answer) => answer.questionId === questionId && isAnswered(answer),
    );
  const { questions } = options.round;
  const answered = questions.filter(
    (question) => answerOf(question.id) !== undefined,
  ).length;
  return [
    headOf({ answered, total: questions.length }),
    ...questions.map(
      (...[question, index]) =>
        `${String(index + 1)}. ${question.text}\n${answerLineOf(answerOf(question.id))}`,
    ),
  ].join("\n");
}
