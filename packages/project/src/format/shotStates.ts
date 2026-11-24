import { z } from "zod";
import { idSchema } from "./values.js";

export const screenSides = ["left", "center", "right", "off"] as const;

export const facings = ["camera", "away", "left", "right"] as const;

export const hands = ["left", "right", "both"] as const;

export const stateEntrySchema = z.strictObject({
  castId: idSchema,
  count: z.int().min(1).max(99).exactOptional(),
  where: z.string(),
  screen: z.enum(screenSides),
  facing: z.enum(facings),
  heldBy: z
    .strictObject({ castId: idSchema, hand: z.enum(hands) })
    .exactOptional(),
  state: z.string(),
  entersFrom: z.string().exactOptional(),
});

export const shotStateSchema = z.union([z.string(), z.array(stateEntrySchema)]);

export const strikeSchema = z.strictObject({
  by: idSchema,
  target: idSchema,
  contact: z.string(),
  reaction: z.string(),
  effect: z
    .strictObject({ kind: z.string(), source: z.string(), path: z.string() })
    .exactOptional(),
});

export type ScreenSide = (typeof screenSides)[number];
export type Facing = (typeof facings)[number];
export type Hand = (typeof hands)[number];
export type StateEntry = z.infer<typeof stateEntrySchema>;
export type ShotState = z.infer<typeof shotStateSchema>;
export type Strike = z.infer<typeof strikeSchema>;
