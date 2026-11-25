import { z } from "zod";
import { filmForms, type FilmForm, type StoryPlan } from "./storyPlan.js";
import { idSchema } from "./values.js";

export const storyApprovals = [
  "person-said-yes",
  "request-said-go-ahead",
] as const;

export const fixedStoryPartIds = ["premise", "world", "unknown"] as const;

export const storyArcRange = { minimum: 3, maximum: 6 } as const;

export const storyCharacterSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  background: z.string(),
  want: z.string(),
  fear: z.string(),
  doesNotKnow: z.string(),
});

export const opposingForceSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  what: z.string(),
  why: z.string(),
});

export const arcStepSchema = z.strictObject({
  id: idSchema,
  text: z.string(),
});

export const storySchema = z.strictObject({
  premise: z.string(),
  world: z.string(),
  worldRule: z.string(),
  characters: z.array(storyCharacterSchema),
  opposingForce: opposingForceSchema,
  arc: z.array(arcStepSchema),
  unknownAtEnd: z.string(),
  form: z.enum(filmForms).exactOptional(),
  approval: z.enum(storyApprovals).exactOptional(),
});

export type StoryApproval = (typeof storyApprovals)[number];
export type StoryCharacter = z.infer<typeof storyCharacterSchema>;
export type OpposingForce = z.infer<typeof opposingForceSchema>;
export type ArcStep = z.infer<typeof arcStepSchema>;
export type Story = z.infer<typeof storySchema>;

export function storyPartIdsOf(story: Story): string[] {
  return [
    "premise",
    "world",
    ...story.characters.map((character) => character.id),
    story.opposingForce.id,
    ...story.arc.map((step) => step.id),
    "unknown",
  ];
}

export function filmFormOf(options: {
  story: Story | undefined;
  plan: StoryPlan | undefined;
}): FilmForm | undefined {
  return options.story?.form ?? options.plan?.form;
}
