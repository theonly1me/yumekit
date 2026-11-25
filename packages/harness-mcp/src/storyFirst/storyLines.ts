import type { ProjectSnapshot, Story, StoryPlan } from "@yumekit/project";
import { cardLandingsOf } from "./cardLandings.js";
import { cardNotesOf, cardScenesOf } from "./trailerCards.js";

const approvalLines = {
  "person-said-yes": "The person said yes to this story.",
  "request-said-go-ahead":
    "The request said to go ahead without asking, so the story is not shown to the person first.",
} as const;

export const storyNotApprovedLine =
  "The person has not said yes to this story yet. End the turn now: show it to the person in plain words (the premise, the hero, what stands against them and why, the arc, and what stays unknown), ask for a yes or changes, and make nothing else until the answer. When the person says yes, call set_story again with approval person-said-yes. A request to make a film is not a yes to its story: give approval request-said-go-ahead only when the request says in words to go ahead without asking.";

export function approvalLineOf(story: Story): string {
  return story.approval === undefined
    ? storyNotApprovedLine
    : approvalLines[story.approval];
}

function storyPartLines(story: Story): string[] {
  return [
    `[premise] ${story.premise}`,
    `[world] ${story.world} The rule: ${story.worldRule}`,
    "Characters:",
    ...story.characters.map(
      (character) =>
        `- [${character.id}] ${character.name}: ${character.background} Wants: ${character.want}. Fears: ${character.fear}. Does not know: ${character.doesNotKnow}.`,
    ),
    `Opposing force: [${story.opposingForce.id}] ${story.opposingForce.name}: ${story.opposingForce.what} Why it acts: ${story.opposingForce.why}`,
    "Arc:",
    ...story.arc.map(
      (...[step, index]) => `${String(index + 1)}. [${step.id}] ${step.text}`,
    ),
    `[unknown] What stays unknown: ${story.unknownAtEnd}`,
  ];
}

function formLine(options: {
  story: Story;
  plan: StoryPlan | undefined;
}): string {
  const { story, plan } = options;
  if (story.form !== undefined) return `Form of the film: ${story.form}`;
  return plan?.form === undefined
    ? "Form of the film: not set (give form to set_story)"
    : `Form of the film: ${plan.form} (from the story plan; give form to set_story)`;
}

function cardLines(snapshot: ProjectSnapshot): string[] {
  const cards = cardScenesOf(snapshot.scenes);
  if (cards.length === 0) return [];
  return [
    "Cards:",
    ...cards.map(
      (card) =>
        `- ${card.sceneId}: "${card.lines.join(" / ")}", story_fact ${card.storyFact ?? "none"}`,
    ),
    ...cardNotesOf({ cards, story: snapshot.bible.story }),
    ...cardLandingsOf({ snapshot }).map((landing) => landing.line),
  ];
}

export function storyWorkLines(snapshot: ProjectSnapshot): string[] {
  const { story } = snapshot.bible;
  const head = "### The story (the ids in brackets are for story_fact)";
  if (story === undefined) {
    return [
      head,
      "(no story yet: for a story film, set_story writes the whole story before set_story_plan)",
      ...cardLines(snapshot),
    ];
  }
  return [
    head,
    approvalLineOf(story),
    formLine({ story, plan: snapshot.bible.storyPlan }),
    ...storyPartLines(story),
    ...cardLines(snapshot),
  ];
}
