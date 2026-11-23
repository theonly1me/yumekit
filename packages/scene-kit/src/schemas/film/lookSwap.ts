import { z } from "zod";
import {
  filmAccent,
  filmHeading,
  filmLabels,
  filmMarkName,
  optionalRegion,
} from "./shared.js";

export const lookSwapLimits = { assets: 6, beatsEach: 8 } as const;

export const lookSwapSchema = {
  purpose:
    "One video for each look of the same content, cut on the beat, with the name of the look under it and an optional headline. Each cut starts its video at its start time, so the content stays and only the look changes. The last look stays to the end of the scene.",
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
      .max(lookSwapLimits.assets)
      .describe(
        "2 to 6 assets in the order they show. The same asset can come twice with different marks.",
      )
      .meta({ assetKinds: ["video", "image"], title: "Looks" }),
    labels: filmLabels(lookSwapLimits.assets),
    marks: z
      .array(filmMarkName)
      .max(lookSwapLimits.assets)
      .optional()
      .describe(
        "Optional mark names in the order of assetIds. The mark of an asset gives its start time and its region.",
      )
      .meta({ title: "Named parts" }),
    region: optionalRegion(),
    beatsEach: z
      .number()
      .min(0.5)
      .max(lookSwapLimits.beatsEach)
      .optional()
      .describe(
        "The beats that each look shows before the cut. The default is 1. With no tempo, a beat is half a second.",
      ),
  }),
};
