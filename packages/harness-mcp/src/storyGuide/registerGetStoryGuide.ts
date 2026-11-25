import type { HarnessContext } from "../context.js";
import {
  endCardSection,
  fightSection,
  musicSection,
  spaceSection,
} from "./storyGuideCraft.js";
import { exampleSection } from "./storyGuideExamples.js";
import {
  formSection,
  storyFirstSection,
  storyWordsSection,
} from "./storyGuideStory.js";
import { cardsSection, trailerExampleSection } from "./storyGuideTrailer.js";
import {
  factsSection,
  firstCutSection,
  knownLimitsSection,
} from "./storyGuideFirstCut.js";
import {
  barSection,
  orderSection,
  pictureSection,
  planSection,
  reviewSection,
  sheetSection,
  videoSection,
} from "./storyGuideSections.js";

export const storyGuide = [
  barSection,
  storyFirstSection,
  formSection,
  storyWordsSection,
  cardsSection,
  firstCutSection,
  orderSection,
  planSection,
  spaceSection,
  fightSection,
  sheetSection,
  factsSection,
  pictureSection,
  videoSection,
  reviewSection,
  musicSection,
  endCardSection,
  trailerExampleSection,
  exampleSection,
].join("\n");

export function registerGetStoryGuide(context: HarnessContext): void {
  context.tools.add({
    name: "get_story_guide",
    description:
      "Read the director's guide for a film with AI video or a story: story first (the whole story before the shots, and why), the form of the film and the parts of a trailer, words on screen that come from the story, cards between the shots on the hits of the music, a worked trailer built from its story, the story plan, space across a cut, staging a fight, the sheets of the cast, how to write a start picture and a video prompt with natural motion, the plan check, the known limits of the models, the rule of tries, the review by the critic, the music prompt, the end card, and the faults of an earlier film with their corrected prompts. Call it before set_story and set_story_plan.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
    run: () => {
      const learned = (
        context.store.read().bible.storyPlan?.lessons ?? []
      ).filter((lesson) => lesson.isLimit);
      const guide = `${storyGuide}\n${knownLimitsSection(learned)}`;
      return {
        content: [
          { type: "text", text: "The story guide." },
          { type: "text", text: guide },
        ],
        structuredContent: { guide },
      };
    },
  });
}
