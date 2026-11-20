import { z } from "zod";

export const idSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,63}$/, "must match ^[a-z0-9][a-z0-9-]{0,63}$");

export const frameCountSchema = z.int().min(0);

export const durationFramesSchema = z.int().min(1);

export const jsonObjectSchema = z.record(z.string(), z.json());

export type JsonObject = z.infer<typeof jsonObjectSchema>;
