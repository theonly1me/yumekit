import { z } from "zod";
import { castLookSchema, lookLimits } from "./castLooks.js";
import { sheetReviewSchema, sheetTrySchema } from "./reviews.js";
import { storySchema } from "./story.js";
import { storyPlanSchema } from "./storyPlan.js";
import { idSchema } from "./values.js";

export const castKinds = ["person", "place", "product", "prop"] as const;

export const castFactLimits = { count: 24, characters: 200 } as const;

export const castPromptLimits = { count: 4, characters: 4000 } as const;

export const castMemberSchema = z.strictObject({
  id: idSchema,
  kind: z.enum(castKinds).default("person"),
  name: z.string(),
  description: z.string(),
  facts: z
    .array(z.string().max(castFactLimits.characters))
    .max(castFactLimits.count)
    .exactOptional(),
  referenceAssetIds: z.array(idSchema),
  sheetReview: sheetReviewSchema.exactOptional(),
  sheetTries: z.array(sheetTrySchema).exactOptional(),
  sheetPrompts: z
    .array(z.string().max(castPromptLimits.characters))
    .max(castPromptLimits.count)
    .exactOptional(),
  restrictions: z
    .array(z.string().max(castFactLimits.characters))
    .max(castFactLimits.count)
    .exactOptional(),
  briefFacts: z
    .array(z.string().max(castFactLimits.characters))
    .max(castFactLimits.count)
    .exactOptional(),
  planNotes: z.array(z.string()).exactOptional(),
  storyCharacterId: idSchema.exactOptional(),
  looks: z.array(castLookSchema).max(lookLimits.looks).exactOptional(),
});

export const bibleSchema = z.strictObject({
  style: z.string(),
  palette: z.array(z.string()),
  cast: z.array(castMemberSchema),
  voice: z.string(),
  story: storySchema.exactOptional(),
  storyPlan: storyPlanSchema.exactOptional(),
});

export type CastKind = (typeof castKinds)[number];
export type CastMember = z.infer<typeof castMemberSchema>;
export type Bible = z.infer<typeof bibleSchema>;
