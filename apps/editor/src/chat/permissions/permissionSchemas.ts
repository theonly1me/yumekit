import { z } from "zod";

export const permissionEntrySchema = z.object({
  kind: z.literal("permission"),
  id: z.string(),
  what: z.string(),
  detail: z.string(),
  folder: z.string().optional(),
  canAllowForProject: z.boolean(),
  askedAt: z.string(),
  waitSeconds: z.number(),
  state: z.enum([
    "open",
    "allowed-once",
    "allowed-for-project",
    "denied",
    "timed-out",
    "ended",
  ]),
});

export type PermissionEntry = z.infer<typeof permissionEntrySchema>;

export type PermissionAnswer = "allow-once" | "allow-for-project" | "deny";
