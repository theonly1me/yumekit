import { z } from "zod";

export const lookIds = [
  "midnight",
  "studio",
  "editorial",
  "neon",
  "paper",
] as const;

export const lookSchema = z.enum(lookIds);

export type LookId = z.infer<typeof lookSchema>;

export const lookOfProjectWithNoLook: LookId = "paper";

export function lookOf(project: { look?: LookId }): LookId {
  return project.look ?? lookOfProjectWithNoLook;
}

export function isCalm(project: { calm?: boolean }): boolean {
  return project.calm === true;
}
