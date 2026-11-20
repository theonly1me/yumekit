import { z } from "zod";

export const imagePanLimits = { caption: 200 } as const;

export const panDirections = [
  "left",
  "right",
  "up",
  "down",
  "in",
  "out",
] as const;

export const imagePanSchema = {
  purpose:
    "One image that fills the picture with a slow pan or zoom over the whole clip, and an optional caption.",
  props: z.strictObject({
    assetId: z
      .string()
      .min(1)
      .describe(
        "The id of an image asset in the project. If the asset is missing, the scene shows a plain placeholder.",
      ),
    caption: z
      .string()
      .max(imagePanLimits.caption)
      .optional()
      .describe("An optional short caption at the top of the picture."),
    direction: z
      .enum(panDirections)
      .optional()
      .describe(
        "The camera move: left, right, up, or down pans across the image, in zooms closer, and out zooms away. The default is in.",
      ),
  }),
};
