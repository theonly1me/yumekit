import {
  chaptersOf,
  takeStepNames,
  type ProjectSnapshot,
  type Take,
} from "@yumekit/project";
import {
  approvedIdsOf,
  countOf,
  noteLineOf,
  takeNameOf,
} from "./takeNoteText.js";

export interface SentRequest {
  text: string;
  details: string;
}

function quoted(ids: string[]): string {
  return ids.map((id) => `"${id}"`).join(", ");
}

function nextStepOf(options: {
  snapshot: ProjectSnapshot;
  take: Take;
}): string {
  const { snapshot, take } = options;
  const chapter = `chapter "${take.chapterId ?? ""}"`;
  switch (take.step) {
    case "story":
      return "Go on to the next step now: write the story plan with set_story_plan if the film has none, then make the pictures of the first chapter in a take of pictures.";
    case "pictures":
      return `Go on to the next step now: open a take of clips for ${chapter}, make its clips from the approved start pictures and its music, then call ready_take.`;
    case "clips":
      return `Go on to the next step now: place the clips and the music of ${chapter}, open a take of the cut, render it with render_video and chapter_id "${take.chapterId ?? ""}", then call ready_take.`;
    case "cut": {
      const chapters = chaptersOf(snapshot.bible.storyPlan);
      const index = chapters.findIndex(
        (candidate) => candidate.id === take.chapterId,
      );
      const next = chapters[index + 1];
      return next === undefined
        ? "This was the last chapter. Tell the person in one short line that the film is ready to export."
        : `Go on to chapter "${next.id}" (${next.title}) now: open a take of pictures for it.`;
    }
  }
}

function estimateLine(take: Take): string[] {
  return take.nextStepEstimateUsd === undefined
    ? []
    : [
        `The estimate of the next step is $${take.nextStepEstimateUsd.toFixed(2)}.`,
      ];
}

export function sentRequestOf(options: {
  snapshot: ProjectSnapshot;
  take: Take;
}): SentRequest {
  const { snapshot, take } = options;
  const approved = approvedIdsOf(take);
  const name = takeNameOf(take);
  if (take.notes.length === 0) {
    return {
      text: `Take ${String(take.number)}: all good. Go on.`,
      details: [
        `The person sent ${name} with no notes, so each item is approved: ${quoted(approved)}.`,
        nextStepOf(options),
        ...estimateLine(take),
      ].join("\n"),
    };
  }
  const notes = countOf({ count: take.notes.length, word: "note" });
  return {
    text: `Take ${String(take.number)}: ${notes} for the lead.`,
    details: [
      `The person sent ${name} with ${notes}:`,
      ...take.notes.map(
        (...[note, index]) =>
          `${String(index + 1)}. ${noteLineOf({ snapshot, take, note })}`,
      ),
      approved.length === 0
        ? "No item of the take is approved."
        : `Approved, so keep them as they are: ${quoted(approved)}.`,
      `Make each item with a note again in a new take of ${takeStepNames[take.step]}: open_take, then ready_take with replaces_asset_id. Leave out each item that the person dropped. If a note is not clear, ask the person.`,
    ].join("\n"),
  };
}
