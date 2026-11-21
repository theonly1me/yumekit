import { z } from "zod";

export const captionWordsLimits = { text: 4000 } as const;

export const captionWordsSchema = {
  purpose:
    "Captions for narration: each word appears when it is spoken, a few words at a time, at the bottom of the picture. Put it on a scene track above another scene, because its background is transparent.",
  props: z.strictObject({
    assetId: z
      .string()
      .min(1)
      .optional()
      .describe(
        "The id of the speech asset with word timings. Start the caption clip at the same frame as the audio clip of that asset.",
      )
      .meta({ assetKind: "audio" }),
    text: z
      .string()
      .max(captionWordsLimits.text)
      .optional()
      .describe(
        "The narration text. The scene uses it when the speech asset has no word timings, and spreads the words evenly over the clip.",
      ),
  }),
};
