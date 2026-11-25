import type { ProjectSnapshot } from "@yumekit/project";
import type { Outcome } from "../../engineTypes.js";
import { failed } from "../chatFailures.js";
import type { ChatFailure } from "../chatTypes.js";
import { answersTextOf } from "./personText.js";
import type { QuestionDesk } from "./questionDesk.js";
import type {
  PersonAnswer,
  QuestionsEntry,
  RequestFile,
} from "./questionSchemas.js";

export interface PersonRequestInput {
  text: string;
  details?: string | undefined;
  aboutClipId: string | undefined;
  files?: { assetId: string; name: string }[] | undefined;
  answers?: { roundId: string; answers: PersonAnswer[] } | undefined;
}

export interface PersonRequest {
  text: string;
  details: string | undefined;
  aboutClipId: string | undefined;
  files: RequestFile[];
  roundId: string | undefined;
  closeRound: () => void;
}

export function personExtrasOf(request: {
  files: RequestFile[];
  roundId: string | undefined;
}): { files?: RequestFile[]; roundId?: string } {
  return {
    ...(request.files.length === 0 ? {} : { files: request.files }),
    ...(request.roundId === undefined ? {} : { roundId: request.roundId }),
  };
}

const questionsClosed: ChatFailure = {
  kind: "questions-closed",
  message:
    "These questions are closed. Read the chat, and write to the AI in the box.",
};

function filesOf(options: {
  snapshot: ProjectSnapshot;
  files: { assetId: string; name: string }[];
}): Outcome<RequestFile[], ChatFailure> {
  const found: RequestFile[] = [];
  for (const file of options.files) {
    const asset = options.snapshot.assets.find(
      (candidate) => candidate.id === file.assetId,
    );
    if (asset === undefined) {
      return failed({
        kind: "file-not-found",
        message: `The file ${file.name} is not in the project now. Remove it, and add it again.`,
      });
    }
    found.push({ assetId: asset.id, name: file.name, kind: asset.kind });
  }
  return { ok: true, value: found };
}

function answerProblemOf(options: {
  round: QuestionsEntry;
  answers: PersonAnswer[];
}): string | undefined {
  const seen = new Set<string>();
  for (const answer of options.answers) {
    const question = options.round.questions.find(
      (candidate) => candidate.id === answer.questionId,
    );
    if (question === undefined || seen.has(answer.questionId)) {
      return `The answer to ${answer.questionId} does not match a question of this round.`;
    }
    seen.add(answer.questionId);
    const outside = answer.choices.find(
      (choice) => !question.options.includes(choice),
    );
    if (outside !== undefined) {
      return `"${outside}" is not an option of the question ${question.id}.`;
    }
    if (!question.multiple && answer.choices.length > 1) {
      return `The question ${question.id} takes one option.`;
    }
  }
  return undefined;
}

function roundAnswersOf(options: {
  round: QuestionsEntry | undefined;
  answers: PersonRequestInput["answers"];
}): Outcome<PersonAnswer[], ChatFailure> {
  const { round, answers } = options;
  if (answers === undefined) return { ok: true, value: [] };
  if (round?.id !== answers.roundId) return failed(questionsClosed);
  const problem = answerProblemOf({ round, answers: answers.answers });
  return problem === undefined
    ? { ok: true, value: answers.answers }
    : failed({ kind: "answers-not-valid", message: problem });
}

export function personRequestOf(options: {
  snapshot: ProjectSnapshot;
  desk: QuestionDesk;
  input: PersonRequestInput;
}): Outcome<PersonRequest, ChatFailure> {
  const { input, desk } = options;
  const files = filesOf({
    snapshot: options.snapshot,
    files: input.files ?? [],
  });
  if (!files.ok) return files;
  const round = desk.openRound();
  const answers = roundAnswersOf({ round, answers: input.answers });
  if (!answers.ok) return answers;
  const details = [
    input.details,
    round === undefined
      ? undefined
      : answersTextOf({ round, answers: answers.value }),
  ].filter((part) => part !== undefined && part !== "");
  return {
    ok: true,
    value: {
      text: input.text,
      details: details.length === 0 ? undefined : details.join("\n\n"),
      aboutClipId: input.aboutClipId,
      files: files.value,
      roundId: round?.id,
      closeRound: () => {
        if (round !== undefined) desk.close({ round, answers: answers.value });
      },
    },
  };
}
