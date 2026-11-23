import { z } from "zod";

export const lowerThirdLimits = { name: 50, role: 80 } as const;

export const lowerThirdSchema = {
  purpose:
    "An overlay with a name and a role on a bar at the lower left, above the captions. Put it on a scene track above the scene of the person, because its background is transparent.",
  props: z.strictObject({
    name: z
      .string()
      .min(1)
      .max(lowerThirdLimits.name)
      .describe("The name of the person or the place."),
    role: z
      .string()
      .max(lowerThirdLimits.role)
      .optional()
      .describe("An optional role or a short line under the name."),
  }),
};
