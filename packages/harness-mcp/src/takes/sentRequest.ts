import {
  chaptersOf,
  reviewCountTextOf,
  reviewCountsOf,
  reviewTotalOf,
  takeStepNames,
  takeTitleOf,
  type ProjectSnapshot,
  type ReviewCounts,
  type Take,
} from "@yumekit/project";
import { pickLinesOf } from "./personPicks.js";
import { approvedIdsOf, reviewLinesOf, takeNameOf } from "./takeNoteText.js";

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

function remakeLinesOf(options: {
  take: Take;
  counts: ReviewCounts;
}): string[] {
  const { counts } = options;
  const step = takeStepNames[options.take.step];
  const remake =
    counts.change === 0
      ? []
      : [
          `Make each item that has mistakes again in a new take of ${step}: open_take, then ready_take with replaces_asset_id. Start from the item and change only what the person asks for.`,
        ];
  const answer =
    counts.question === 0
      ? []
      : [
          `${counts.change === 0 ? `Open a new take of ${step} to answer` : "In that take, answer"} each item that the person is not sure about: name it again in ready_take with your answer in its note, or make it again with replaces_asset_id when the answer is a change.`,
        ];
  const leave =
    counts.dropped === 0
      ? []
      : ["Leave out each item that the person dropped."];
  return [
    ...remake,
    ...answer,
    ...leave,
    "If a note is not clear, ask the person.",
  ];
}

export function sentRequestOf(options: {
  snapshot: ProjectSnapshot;
  take: Take;
}): SentRequest {
  const { snapshot, take } = options;
  const approved = approvedIdsOf(take);
  const name = takeNameOf(take);
  const title = takeTitleOf({
    take,
    chapters: chaptersOf(snapshot.bible.storyPlan),
  });
  const counts = reviewCountsOf(take.notes);
  const lines = reviewLinesOf(options);
  const picks = pickLinesOf(options);
  const pickLines =
    picks.length === 0
      ? []
      : [
          'The person marked these "Looks right" over their other versions. Put each into the film as it is, remake nothing for its place, and never undo that choice:',
          ...picks,
        ];
  if (reviewTotalOf(counts) === 0) {
    return {
      text: `${title}: all good. Go on.`,
      details: [
        `The person sent ${name} with no change, so each item is approved: ${quoted(approved)}.`,
        ...(lines.length === 0
          ? []
          : [
              "The person's words on approved items, to keep in mind:",
              ...lines,
            ]),
        ...pickLines,
        nextStepOf(options),
        ...estimateLine(take),
      ].join("\n"),
    };
  }
  const summary = reviewCountTextOf(counts);
  return {
    text: `${title}: ${summary}.`,
    details: [
      `The person sent ${name}: ${summary}.`,
      ...lines,
      approved.length === 0
        ? "No item of the take is approved."
        : `Approved, so keep them as they are: ${quoted(approved)}.`,
      ...pickLines,
      ...remakeLinesOf({ take, counts }),
    ].join("\n"),
  };
}
