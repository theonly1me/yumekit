import type { AskInput } from "./chatRequests.js";
import type { ChatEntry } from "./chatSchemas.js";
import type { QuestionsEntry } from "./questions/questionSchemas.js";

export const answersAgainText = "Here are my answers again.";

export function roundOf(options: {
  entries: ChatEntry[];
  roundId: string | undefined;
}): QuestionsEntry | undefined {
  if (options.roundId === undefined) return undefined;
  return options.entries.find(
    (entry): entry is QuestionsEntry =>
      entry.kind === "questions" && entry.id === options.roundId,
  );
}

export function withEntry(options: {
  entries: ChatEntry[];
  entry: ChatEntry;
}): ChatEntry[] {
  const { entries, entry } = options;
  return entries.some((current) => current.id === entry.id)
    ? entries.map((current) => (current.id === entry.id ? entry : current))
    : [...entries, entry];
}

export function hasRunningAnswer(entries: ChatEntry[]): boolean {
  return entries.some(
    (entry) => entry.kind === "answer" && entry.state === "running",
  );
}

export function laterChangeCount(options: {
  entries: ChatEntry[];
  changeId: string;
}): number {
  const index = options.entries.findIndex(
    (entry) => entry.id === options.changeId,
  );
  return options.entries
    .slice(index + 1)
    .filter(
      (entry) =>
        entry.kind === "change" && !entry.undone && entry.undoSteps > 0,
    ).length;
}

export function retryOf(options: {
  entries: ChatEntry[];
  noticeId: string;
}): AskInput | undefined {
  const { entries } = options;
  const index = entries.findIndex((entry) => entry.id === options.noticeId);
  if (index !== entries.length - 1) return undefined;
  const before = entries.slice(0, index).reverse();
  const answerIndex = before.findIndex((entry) => entry.kind === "answer");
  const answer = before[answerIndex];
  if (answer?.kind !== "answer" || answer.state !== "failed") return undefined;
  const request = before
    .slice(answerIndex + 1)
    .find((entry) => entry.kind === "request" || entry.kind === "steering");
  if (request?.kind !== "request" && request?.kind !== "steering") {
    return undefined;
  }
  const isAnswersOnly = request.roundId !== undefined && request.text === "";
  return {
    text: isAnswersOnly ? answersAgainText : request.text,
    details: request.details,
    aboutClipId: request.about?.clipId,
    files: request.files?.map((file) => ({
      assetId: file.assetId,
      name: file.name,
    })),
  };
}
