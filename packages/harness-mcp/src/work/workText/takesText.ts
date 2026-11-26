import {
  approvePicturesFirstOf,
  chaptersOf,
  currentTakesOf,
  filmChapterId,
  lastSentTakeOf,
  reviewCountTextOf,
  reviewCountsOf,
  reviewTotalOf,
  type ProjectSnapshot,
  type Take,
} from "@yumekit/project";
import { waitingPickLinesOf } from "../../takes/personPicks.js";
import { approvePicturesFirstMeaning } from "../../takes/registerSetApprovePicturesFirst.js";
import {
  approvedIdsOf,
  countOf,
  reviewLinesOf,
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
  const current = currentTakesOf(takes).at(-1);
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
  const counts = reviewCountsOf(take.notes);
  const review =
    reviewTotalOf(counts) === 0 ? "no change" : reviewCountTextOf(counts);
  return [
    `The person sent last: ${takeNameOf(take)} at ${take.sentAt ?? "an unknown time"}: ${review}.`,
    ...reviewLinesOf({ snapshot, take }),
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
    ...waitingPickLinesOf(snapshot),
  ];
}
