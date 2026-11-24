import type { HarnessContext } from "../context.js";
import {
  endCardSection,
  fightSection,
  musicSection,
  spaceSection,
} from "./storyGuideCraft.js";
import { exampleSection } from "./storyGuideExamples.js";
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
  orderSection,
  planSection,
  spaceSection,
  fightSection,
  sheetSection,
  pictureSection,
  videoSection,
  reviewSection,
  musicSection,
  endCardSection,
  exampleSection,
].join("\n");

export function registerGetStoryGuide(context: HarnessContext): void {
  context.tools.add({
    name: "get_story_guide",
    description:
      "Read the director's guide for a film with AI video or a story: the story plan, space across a cut, staging a fight, the sheets of the cast, how to write a start picture and a video prompt with natural motion, the review by the critic, the music prompt, the end card, and the faults of an earlier film with their corrected prompts. Call it before set_story_plan.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
    run: () => ({
      content: [
        { type: "text", text: "The story guide." },
        { type: "text", text: storyGuide },
      ],
      structuredContent: { guide: storyGuide },
    }),
  });
}
