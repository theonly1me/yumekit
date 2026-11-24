import { z } from "zod";
import {
  filmAccent,
  filmHeading,
  filmLabels,
  filmStartSeconds,
} from "./shared.js";

export const shapesLimits = { assets: 3 } as const;

export const shapesSchema = {
  purpose:
    "The same moment of one to three videos side by side, each in the shape of its file (wide, tall, square), with an optional label under each and a headline. For one video made for each platform. The videos stay in step: each shows the same second of its file at each frame.",
  props: z.strictObject({
    heading: filmHeading,
    accent: filmAccent,
    assetIds: z
      .array(
        z
          .string()
          .min(1)
          .describe("The id of a video or an image asset in the project."),
      )
      .min(1)
      .max(shapesLimits.assets)
      .describe(
        "1 to 3 assets, for example the wide, the tall, and the square copy of one video.",
      )
      .meta({ assetKinds: ["video", "image"], title: "Videos" }),
    labels: filmLabels(shapesLimits.assets),
    startSeconds: filmStartSeconds,
  }),
};
