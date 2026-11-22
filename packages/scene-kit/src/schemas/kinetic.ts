import { z } from "zod";

export const kineticLimits = { line: 80, lines: 4 } as const;

export const kineticLine = z
  .string()
  .min(1)
  .max(kineticLimits.line)
  .describe("One short line, 1 to 5 words.");

export const kineticSchema = {
  purpose:
    "1 to 4 short lines, one at a time, each as large as the picture allows, for a strong statement. With a speech asset, each line comes in when the voice says its first word.",
  props: z.strictObject({
    lines: z
      .array(kineticLine)
      .min(1)
      .max(kineticLimits.lines)
      .describe(
        "The lines in order. The last line stays and gets the accent color.",
      ),
    assetId: z
      .string()
      .min(1)
      .optional()
      .describe(
        "The id of the speech asset with word timings that says the lines. Start this clip at the same frame as the audio clip of that asset. Without it, the lines come in at an even pace.",
      )
      .meta({ assetKind: "audio", title: "Voice" }),
  }),
};
