import type { AssetMark } from "@yumekit/project";
import { z } from "zod";

const share = z.number().min(0).max(1);

export const regionInput = z
  .strictObject({
    x: share.describe("The left edge, from 0 (left) to 1 (right)."),
    y: share.describe("The top edge, from 0 (top) to 1 (bottom)."),
    width: z
      .number()
      .gt(0)
      .max(1)
      .describe("The width as a share of the picture."),
    height: z
      .number()
      .gt(0)
      .max(1)
      .describe("The height as a share of the picture."),
  })
  .describe(
    "A part of the picture as shares from 0 to 1. x + width and y + height are at most 1.",
  );

export const markNameInput = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .describe('A short name, for example "the prompt" or "the look changes".');

export const secondsInput = z
  .number()
  .min(0)
  .describe("The second of the video where the moment starts.");

export const markInput = z.strictObject({
  name: markNameInput,
  region: regionInput.optional(),
  seconds: secondsInput.optional(),
});

export type MarkInput = z.infer<typeof markInput>;

export function assetMarkOf(input: MarkInput): AssetMark {
  return {
    name: input.name,
    ...(input.region === undefined ? {} : { region: input.region }),
    ...(input.seconds === undefined ? {} : { seconds: input.seconds }),
  };
}

export function wireMarkOf(mark: AssetMark) {
  return {
    name: mark.name,
    ...(mark.region === undefined ? {} : { region: mark.region }),
    ...(mark.seconds === undefined ? {} : { seconds: mark.seconds }),
  };
}
