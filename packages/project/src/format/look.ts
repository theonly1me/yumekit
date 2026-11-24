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

const lookColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "must be a color such as #0c0c0d");

export const lookColorsSchema = z.strictObject({
  background: lookColorSchema,
  text: lookColorSchema,
  muted: lookColorSchema,
  accent: lookColorSchema,
});

export type LookColors = z.infer<typeof lookColorsSchema>;
