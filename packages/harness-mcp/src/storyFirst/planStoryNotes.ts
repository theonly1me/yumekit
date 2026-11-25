import {
  filmForms,
  storyPartIdsOf,
  type Shot,
  type Story,
  type StoryPlan,
} from "@yumekit/project";
import { storyPartIdsLine } from "./trailerCards.js";

const quotedWords = /["“”][^"“”]{3,}["“”]/;

export const missingStoryNote =
  "Note: this project has no story yet, so the shots have nothing behind them, and the lines on screen turn generic. Write the whole story with set_story first: the premise in one sentence; the world and its rule; each main character with background, want, fear, and what they do not know; the opposing force and why it acts; the arc in 3 to 6 steps; and what stays unknown at the end. Then give each shot the story_fact that it shows.";

export const trailerFormNote =
  "Note: a trailer shows moments from different times and places of the longer story. It raises the question and does not answer it: no shot shows how a conflict ends. Put a trailer-card between the moments, on the hits of the music, and end on the title card. get_story_guide has the parts of a trailer.";

function formNotes(plan: StoryPlan): string[] {
  if (plan.form === undefined) {
    return [
      `Note: the plan has no form. Give form (${filmForms.join(", ")}): the structure of the film follows it, and get_story_guide gives the craft of each.`,
    ];
  }
  return plan.form === "trailer" ? [trailerFormNote] : [];
}

function hasQuotedWords(shot: Shot): boolean {
  return (
    quotedWords.test(shot.videoPrompt ?? "") ||
    quotedWords.test(shot.startPicturePrompt ?? "")
  );
}

function shotNotes(options: { plan: StoryPlan; story: Story }): string[] {
  const known = new Set(storyPartIdsOf(options.story));
  return options.plan.shots.flatMap((shot) => {
    if (shot.storyFact !== undefined && !known.has(shot.storyFact)) {
      return [
        `Note: shot "${shot.id}" names story_fact "${shot.storyFact}", which is not a part of the story. The parts: ${storyPartIdsLine(options.story)}.`,
      ];
    }
    if (shot.storyFact === undefined && hasQuotedWords(shot)) {
      return [
        `Note: shot "${shot.id}" has words in quotes (a spoken line or a text) and no story_fact. Each spoken line comes from the story: give the id of the part that it says.`,
      ];
    }
    return [];
  });
}

export function planStoryNotesOf(options: {
  plan: StoryPlan;
  story: Story | undefined;
}): string[] {
  const { plan, story } = options;
  if (story === undefined) return [missingStoryNote, ...formNotes(plan)];
  const approval =
    story.approval === undefined
      ? [
          "Note: the person has not said yes to the story yet. Show it in plain words and ask, and make nothing else until the answer, unless the request says in words to go ahead without asking.",
        ]
      : [];
  return [...approval, ...formNotes(plan), ...shotNotes({ plan, story })];
}
