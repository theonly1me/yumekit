import { z } from "zod";

export const deviceLimits = { caption: 120 } as const;

export const deviceFrames = ["browser", "phone"] as const;

export const deviceSchema = {
  purpose:
    "A picture or a video of a product inside a browser window or a phone, which comes in with a small tilt and settles, with an optional line beside or above it. For a product demo or a screenshot.",
  props: z.strictObject({
    assetId: z
      .string()
      .min(1)
      .describe(
        "The id of an image or a video asset in the project, for example a screenshot or a screen recording. It fills the screen and is cut to its shape. If the asset is missing, the screen shows a plain placeholder.",
      )
      .meta({ assetKinds: ["image", "video"] }),
    frame: z
      .enum(deviceFrames)
      .optional()
      .describe(
        "browser draws a browser window and phone draws a phone. The default is browser in a wide or square picture and phone in a tall one.",
      )
      .meta({ title: "Device" }),
    caption: z
      .string()
      .max(deviceLimits.caption)
      .optional()
      .describe(
        "An optional short line, beside the device in a wide picture and above it in a tall one.",
      ),
  }),
};
