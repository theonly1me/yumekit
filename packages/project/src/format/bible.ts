import { z } from "zod";
import { idSchema } from "./values.js";

export const castMemberSchema = z.strictObject({
  id: idSchema,
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

export type CastMember = z.infer<typeof castMemberSchema>;
export type Bible = z.infer<typeof bibleSchema>;
