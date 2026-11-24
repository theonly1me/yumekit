import { z } from "zod";
import { filmAccent, filmHeading, filmStartSeconds } from "./shared.js";

export const wallLimits = { assets: 16, columns: 6 } as const;

export const wallSchema = {
  purpose:
    "2 to 16 videos or pictures as an even grid that comes in on the beat, with an optional headline. For many examples at once. The videos play in step.",
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
      .min(2)
      .max(wallLimits.assets)
      .describe(
        "The assets in reading order. A missing asset shows a plain placeholder.",
      )
      .meta({ assetKinds: ["video", "image"], title: "Videos and pictures" }),
    columns: z
      .int()
      .min(1)
      .max(wallLimits.columns)
      .optional()
      .describe(
        "The number of columns. By default the scene picks the count that makes each picture largest.",
      ),
    startSeconds: filmStartSeconds,
    startSecondsEach: z
      .array(z.number().min(0).describe("The start second of one video."))
      .max(wallLimits.assets)
      .optional()
      .describe(
        "The start second of each video, in the order of assetIds, for example [5.9, 3.4, 1.4] to show the best moment of each. It replaces startSeconds for those videos.",
      )
      .meta({ title: "Start second of each" }),
  }),
};
