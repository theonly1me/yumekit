import { z } from "zod";

export const logoRevealLimits = { name: 40, tagline: 100 } as const;

export const logoRevealSchema = {
  purpose:
    "A name and a logo that come in with a ring drawn around the logo, and an optional line of text. Without a logo picture, the ring holds the first letter of the name. For the brand moment at the start or the end.",
  props: z.strictObject({
    name: z
      .string()
      .min(1)
      .max(logoRevealLimits.name)
      .describe("The name of the product, the company, or the person."),
    assetId: z
      .string()
      .min(1)
      .optional()
      .describe(
        "The id of an image asset of the logo, best a square picture. Without it, the ring holds the first letter of the name.",
      )
      .meta({ assetKind: "image", title: "Logo" }),
    tagline: z
      .string()
      .max(logoRevealLimits.tagline)
      .optional()
      .describe("An optional short line under the name."),
  }),
};
