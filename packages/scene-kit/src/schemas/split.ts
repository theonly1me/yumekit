import { z } from "zod";

export const splitLimits = { heading: 100, body: 200 } as const;

export const splitSides = ["left", "right"] as const;

export const splitSchema = {
  purpose:
    "A picture or a video on one half and a heading with a line of text on the other half. In a tall picture, the halves are top and bottom. For a feature with a picture.",
  props: z.strictObject({
    assetId: z
      .string()
      .min(1)
      .describe(
        "The id of an image or a video asset in the project. It fills its half and is cut to its shape. If the asset is missing, the half shows a plain placeholder.",
      )
      .meta({ assetKinds: ["image", "video"] }),
    heading: z
      .string()
      .min(1)
      .max(splitLimits.heading)
      .describe("The heading, 2 to 6 words."),
    body: z
      .string()
      .max(splitLimits.body)
      .optional()
      .describe("An optional line under the heading. One sentence reads best."),
    side: z
      .enum(splitSides)
      .optional()
      .describe(
        "The half of the picture or video: left (the top in a tall picture) or right (the bottom in a tall picture). The default is left.",
      ),
  }),
};
