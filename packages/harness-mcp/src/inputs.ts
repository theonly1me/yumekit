import { z } from "zod";

const idPattern = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function idInput(description: string) {
  return z
    .string()
    .regex(idPattern, "must match ^[a-z0-9][a-z0-9-]{0,63}$")
    .describe(
      `${description} Lowercase letters, digits, and hyphens, 1 to 64 characters.`,
    );
}

export function frameInput(description: string) {
  return z.int().min(0).describe(`${description} In whole frames, 0 or more.`);
}

export function durationInput(description: string) {
  return z.int().min(1).describe(`${description} In whole frames, 1 or more.`);
}

export const jsonObjectInput = z.record(z.string(), z.json());

export const scaleInput = z
  .union([z.literal(0.25), z.literal(0.5), z.literal(1)])
  .optional()
  .describe(
    "Pixel density: 0.25, 0.5, or 1. The layout is the same at each scale. 0.25 of 1920 by 1080 gives 480 by 270.",
  );
