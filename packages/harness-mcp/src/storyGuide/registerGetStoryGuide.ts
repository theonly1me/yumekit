import type { HarnessContext } from "../context.js";
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
  sheetSection,
  pictureSection,
  videoSection,
  reviewSection,
  exampleSection,
].join("\n");

export function registerGetStoryGuide(context: HarnessContext): void {
  context.tools.add({
    name: "get_story_guide",
    description:
      "Read the director's guide for a film with AI video or a story: the story plan, the sheets of the cast, how to write a start picture and a video prompt with natural motion, the review of a clip, and the faults of an earlier film with their corrected prompts. Call it before set_story_plan.",
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
