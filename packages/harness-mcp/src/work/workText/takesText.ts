import {
  approvePicturesFirstOf,
  chaptersOf,
  filmChapterId,
  lastSentTakeOf,
  type ProjectSnapshot,
  type Take,
} from "@yumekit/project";
import { approvePicturesFirstMeaning } from "../../takes/registerSetApprovePicturesFirst.js";
import {
  approvedIdsOf,
  countOf,
  noteLineOf,
  takeNameOf,
} from "../../takes/takeNoteText.js";

function quoted(ids: string[]): string {
  return ids.map((id) => `"${id}"`).join(", ");
}

function chapterLine(snapshot: ProjectSnapshot): string {
  const chapters = chaptersOf(snapshot.bible.storyPlan);
  const [only] = chapters;
  if (chapters.length === 1 && only?.id === filmChapterId) {
    return `Chapters: one, "${filmChapterId}" (the whole film).`;
  }
  return `Chapters: ${chapters
    .map(
      (...[chapter, index]) =>
        `${String(index + 1)}. "${chapter.id}" ${chapter.title}: shots ${chapter.shotIds.join(", ")}.`,
    )
    .join(" ")}`;
}

function currentTakeLine(takes: readonly Take[]): string {
  const current = takes.findLast((take) => take.state !== "sent");
  if (current === undefined) {
    return "Open take: none. Call open_take before the next round of work.";
  }
  const items = quoted(current.items.map((item) => item.id)) || "none yet";
  const count = countOf({ count: current.items.length, word: "item" });
  return current.state === "open"
    ? `Open take: ${takeNameOf(current)}, open, with ${count}: ${items}. When the round is done, call ready_take.`
    : `Open take: ${takeNameOf(current)}, ready, with ${count}. It waits for the person: end your turn.`;
}

function sentLines(snapshot: ProjectSnapshot): string[] {
  const take = lastSentTakeOf(snapshot.takes);
  if (take === undefined) return ["The person sent last: no take yet."];
  const approved = approvedIdsOf(take);
  return [
    `The person sent last: ${takeNameOf(take)} at ${take.sentAt ?? "an unknown time"}, with ${countOf({ count: take.notes.length, word: "note" })}.`,
    ...take.notes.map(
      (...[note, index]) =>
        `${String(index + 1)}. ${noteLineOf({ snapshot, take, note })}`,
    ),
    `Approved: ${quoted(approved) || "none"}.`,
  ];
}

export function takesLines(snapshot: ProjectSnapshot): string[] {
  const setting = approvePicturesFirstOf(snapshot.project) ? "on" : "off";
  return [
    "### Chapters and takes",
    chapterLine(snapshot),
    `Approve pictures before clips: ${setting}. ${approvePicturesFirstMeaning}`,
    currentTakeLine(snapshot.takes),
    ...sentLines(snapshot),
  ];
}
