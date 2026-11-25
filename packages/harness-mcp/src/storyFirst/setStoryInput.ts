import {
  filmForms,
  fixedStoryPartIds,
  storyApprovals,
  storyArcRange,
  type Story,
} from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../inputs.js";
import type { HarnessFailure } from "../results.js";

const words = z.string().trim().min(1);

const characterInput = z.strictObject({
  character_id: idInput(
    "The id of the character, for story_fact and for story_character_id of put_cast_member, for example 'oda'.",
  ),
  name: words.describe("The name."),
  background: words.describe(
    "Where they come from, and what happened to them before the story starts.",
  ),
  want: words.describe("What they want."),
  fear: words.describe("What they fear."),
  does_not_know: words.describe(
    "What they do not know at the start, which the story reveals.",
  ),
});

const opposingForceInput = z
  .strictObject({
    force_id: idInput("The id of the opposing force, for example 'keeper'."),
    name: words.describe("Its name."),
    what: words.describe(
      "What it is: a person, a group, a place, or a force of nature.",
    ),
    why: words.describe(
      "Why it acts, as a reason that is true to it. A villain believes that he is right.",
    ),
  })
  .describe("What stands against the main character, and why it acts.");

const arcStepInput = z.strictObject({
  step_id: idInput("The id of the step, for example 'the-break'."),
  step: words.describe("What happens in this step of the whole story."),
});

export const setStoryInput = {
  premise: words.describe(
    "The whole story in one sentence: who wants what, what stands against it, and what is at stake.",
  ),
  world: words.describe(
    "The world: the place, the time, and how people live there.",
  ),
  world_rule: words.describe(
    "The one rule of this world that the story turns on, for example 'the bell under the lake rings once before each death'.",
  ),
  characters: z
    .array(characterInput)
    .min(1)
    .max(6)
    .describe("Each main character, the hero first."),
  opposing_force: opposingForceInput,
  arc: z
    .array(arcStepInput)
    .min(storyArcRange.minimum)
    .max(storyArcRange.maximum)
    .describe(
      "The arc of the whole story in 3 to 6 steps, in order, also for a trailer that shows only a part of it.",
    ),
  unknown_at_end: words.describe(
    "What stays unknown at the end. For a trailer: the question that it raises and never answers.",
  ),
  form: z
    .enum(filmForms)
    .optional()
    .describe(
      "The form of the film, which decides its structure: trailer (moments of a longer story, raises a question and never answers it), short (one complete small story with an end), explainer, music-video, or other. get_story_guide gives the craft of each.",
    ),
  approval: z
    .enum(storyApprovals)
    .optional()
    .describe(
      "Leave it out on the first write, then end the turn and ask the person. person-said-yes after the person said yes to this story. request-said-go-ahead only when the request says in words to go ahead without asking, for example 'just make it, don't ask me'. A request to make a film is not a yes to its story.",
    ),
};

export type SetStoryInput = z.infer<z.ZodObject<typeof setStoryInput>>;

function sameStory(options: { first: Story; second: Story }): boolean {
  const withoutApproval = (story: Story) =>
    JSON.stringify({ ...story, approval: undefined });
  return withoutApproval(options.first) === withoutApproval(options.second);
}

export function storyOf(options: {
  input: SetStoryInput;
  earlier: Story | undefined;
}): Story {
  const { input, earlier } = options;
  const written: Story = {
    premise: input.premise,
    world: input.world,
    worldRule: input.world_rule,
    characters: input.characters.map((character) => ({
      id: character.character_id,
      name: character.name,
      background: character.background,
      want: character.want,
      fear: character.fear,
      doesNotKnow: character.does_not_know,
    })),
    opposingForce: {
      id: input.opposing_force.force_id,
      name: input.opposing_force.name,
      what: input.opposing_force.what,
      why: input.opposing_force.why,
    },
    arc: input.arc.map((step) => ({ id: step.step_id, text: step.step })),
    unknownAtEnd: input.unknown_at_end,
    ...(input.form === undefined ? {} : { form: input.form }),
  };
  const kept =
    earlier?.approval !== undefined &&
    sameStory({ first: earlier, second: written })
      ? earlier.approval
      : undefined;
  const approval = input.approval ?? kept;
  return approval === undefined ? written : { ...written, approval };
}

export function storyRefusalOf(story: Story): HarnessFailure | undefined {
  const ids = [
    ...story.characters.map((character) => character.id),
    story.opposingForce.id,
    ...story.arc.map((step) => step.id),
  ];
  const fixed: readonly string[] = fixedStoryPartIds;
  const taken = ids.filter(
    (...[id, index]) => fixed.includes(id) || ids.indexOf(id) !== index,
  );
  if (taken.length === 0) return undefined;
  return {
    kind: "id-in-use",
    message: `Each part of the story needs its own id. These ids are used twice or are fixed: ${[...new Set(taken)].join(", ")}.`,
    hint: `Give each character, the opposing force, and each step of the arc its own id. ${fixedStoryPartIds.join(", ")} are the fixed ids of the premise, the world, and what stays unknown.`,
  };
}
