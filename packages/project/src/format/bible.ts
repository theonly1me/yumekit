import { z } from "zod";
import { storyPlanSchema } from "./storyPlan.js";
import { idSchema } from "./values.js";

export const castKinds = ["person", "place", "product", "prop"] as const;

export const castFactLimits = { count: 24, characters: 200 } as const;

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
});

export const bibleSchema = z.strictObject({
  style: z.string(),
  palette: z.array(z.string()),
  cast: z.array(castMemberSchema),
  voice: z.string(),
  storyPlan: storyPlanSchema.exactOptional(),
});

export type CastKind = (typeof castKinds)[number];
export type CastMember = z.infer<typeof castMemberSchema>;
export type Bible = z.infer<typeof bibleSchema>;
