import { z } from "zod";
import { idSchema } from "./values.js";

export const castKinds = ["person", "place", "product"] as const;

export const castMemberSchema = z.strictObject({
  id: idSchema,
  kind: z.enum(castKinds).default("person"),
  name: z.string(),
  description: z.string(),
  referenceAssetIds: z.array(idSchema),
});

export const bibleSchema = z.strictObject({
  style: z.string(),
  palette: z.array(z.string()),
  cast: z.array(castMemberSchema),
  voice: z.string(),
});

export type CastKind = (typeof castKinds)[number];
export type CastMember = z.infer<typeof castMemberSchema>;
export type Bible = z.infer<typeof bibleSchema>;
