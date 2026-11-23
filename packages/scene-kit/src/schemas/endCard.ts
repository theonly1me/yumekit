import { z } from "zod";

export const endCardLimits = { heading: 100, action: 40, handle: 60 } as const;

export const endCardSchema = {
  purpose:
    "The last scene of a video: a large closing line, a call to action on a button, and an address or a handle under it.",
  props: z.strictObject({
    heading: z
      .string()
      .min(1)
      .max(endCardLimits.heading)
      .describe("The closing line, 2 to 6 words."),
    action: z
      .string()
      .max(endCardLimits.action)
      .optional()
      .describe(
        "An optional call to action on the button, 1 to 4 words. For example Try it today.",
      )
      .meta({ title: "Button" }),
    handle: z
      .string()
      .max(endCardLimits.handle)
      .optional()
      .describe(
        "An optional web address or handle under the button, for example example.com or @name.",
      )
      .meta({ title: "Address or handle" }),
  }),
};
