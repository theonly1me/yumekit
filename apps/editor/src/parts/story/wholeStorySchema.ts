import { z } from "zod";

export const wholeStorySchema = z.object({
  premise: z.string(),
  world: z.string(),
  worldRule: z.string(),
  characters: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      background: z.string(),
      want: z.string(),
      fear: z.string(),
      doesNotKnow: z.string(),
    }),
  ),
  opposingForce: z.object({
    id: z.string(),
    name: z.string(),
    what: z.string(),
    why: z.string(),
  }),
  arc: z.array(z.object({ id: z.string(), text: z.string() })),
  unknownAtEnd: z.string(),
  approval: z.enum(["person-said-yes", "request-said-go-ahead"]).optional(),
});

export type WholeStory = z.infer<typeof wholeStorySchema>;

export const filmFormLabels: Record<string, string> = {
  trailer: "A trailer",
  short: "A short film",
  explainer: "An explainer",
  "music-video": "A music video",
  other: "A film",
};

export function storyPartNameOf(options: {
  story: WholeStory | undefined;
  partId: string;
}): string | undefined {
  const { story, partId } = options;
  if (story === undefined) return undefined;
  const fixed: Record<string, string> = {
    premise: "the premise",
    world: "the world",
    unknown: "what stays unknown",
  };
  const character = story.characters.find((entry) => entry.id === partId);
  const step = story.arc.findIndex((entry) => entry.id === partId);
  if (fixed[partId] !== undefined) return fixed[partId];
  if (character !== undefined) return character.name;
  if (story.opposingForce.id === partId) return story.opposingForce.name;
  return step === -1 ? undefined : `step ${String(step + 1)} of the arc`;
}
