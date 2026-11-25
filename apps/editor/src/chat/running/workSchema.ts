import { z } from "zod";

export const workItemSchema = z.object({
  id: z.string(),
  kind: z.enum(["media", "review"]),
  what: z.string(),
  subject: z.string(),
  shotId: z.string().optional(),
  castId: z.string().optional(),
  server: z.string().optional(),
  state: z.enum(["waiting", "running"]),
  startedAt: z.string(),
});

export type WorkItem = z.infer<typeof workItemSchema>;

export const workListSchema = z.object({ items: z.array(workItemSchema) });
