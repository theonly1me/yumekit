import type { AskInput } from "./chatRequests.js";
import type { ChatEntry } from "./chatSchemas.js";

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
    .find((entry) => entry.kind === "request");
  return request?.kind === "request"
    ? { text: request.text, aboutClipId: request.about?.clipId }
    : undefined;
}
