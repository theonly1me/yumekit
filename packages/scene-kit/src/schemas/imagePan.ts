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
    "One image that fills the picture with a slow pan or zoom over the whole clip, and an optional caption of its own at the top. The scene cuts the image to the shape of the output, so a wide image loses its sides in a tall output. Make a separate image for each shape when the sides matter.",
  props: z.strictObject({
    assetId: z
      .string()
      .min(1)
      .describe(
        "The id of an image asset in the project. The scene cuts the image to the shape of the output. If the asset is missing, the scene shows a plain placeholder.",
      ),
    caption: z
      .string()
      .max(imagePanLimits.caption)
      .optional()
      .describe(
        "An optional short caption of this scene, on a panel at the top of the picture. It is not the narration caption, which place_narration puts at the bottom.",
      ),
    direction: z
      .enum(panDirections)
      .optional()
      .describe(
        "The camera move: left, right, up, or down pans across the image, in zooms closer, and out zooms away. The default is in.",
      ),
  }),
};
