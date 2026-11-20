import { z } from "zod";
import { idSchema, jsonObjectSchema } from "./values.js";

export const sceneSourceSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("kit"),
    component: z.string().min(1),
    props: jsonObjectSchema,
  }),
  z.strictObject({ kind: z.literal("module"), props: jsonObjectSchema }),
]);

export const sceneSchema = z.strictObject({
  id: idSchema,
  title: z.string(),
  notes: z.string(),
  source: sceneSourceSchema,
});

export type SceneSource = z.infer<typeof sceneSourceSchema>;
export type Scene = z.infer<typeof sceneSchema>;
