import { storyPartIdsOf } from "@yumekit/project";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { failureResult } from "../results.js";
import { setStoryInput, storyOf, storyRefusalOf } from "./setStoryInput.js";
import { approvalLineOf } from "./storyLines.js";

export function registerSetStory(context: HarnessContext): void {
  context.tools.add({
    name: "set_story",
    description:
      "Write the whole story before any shot of a story film (a trailer, a short, an anime, a music video with a story): the premise in one sentence; the world and its rule; each main character with background, want, fear, and what they do not know; the opposing force and why it acts (a villain has a reason that is true to him); the arc of the whole story in 3 to 6 steps; and what stays unknown at the end. A trailer shows a part of a longer story, so it needs the whole story too. Every shot, every card, and every spoken line then comes from a part of it: give its id as story_fact. After the first write, end the turn: show the story to the person in plain words, ask for a yes or changes, and make nothing else until the answer. A request to make a film is not a yes to its story; skip the question only when the request says in words to go ahead without asking. The call replaces the whole story. Read get_story_guide first.",
    inputSchema: setStoryInput,
    run: ({ input }) => {
      const { bible } = context.store.read();
      const story = storyOf({ input, earlier: bible.story });
      const refusal = storyRefusalOf(story);
      if (refusal !== undefined) return failureResult(refusal);
      const partIds = storyPartIdsOf(story);
      return applyEditsResult({
        store: context.store,
        edits: [{ kind: "setBible", bible: { ...bible, story } }],
        line: [
          `The story is saved: ${String(story.characters.length)} characters, the opposing force "${story.opposingForce.name}", and ${String(story.arc.length)} steps of the arc.`,
          `The ids for story_fact: ${partIds.join(", ")}.`,
          approvalLineOf(story),
        ].join("\n"),
        data: {
          story_part_ids: partIds,
          approval: story.approval ?? "not-asked-yet",
        },
      });
    },
  });
}
