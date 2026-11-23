import { z } from "zod";

export const chatLimits = { request: 160, answer: 240, name: 30 } as const;

export const chatSchema = {
  purpose:
    "A request that a person types, with a cursor, and the answer of a product, as two chat bubbles. For a product that a person talks to or asks.",
  props: z.strictObject({
    request: z
      .string()
      .min(1)
      .max(chatLimits.request)
      .describe(
        "What the person types. It shows letter by letter. Under 80 characters reads best.",
      ),
    answer: z
      .string()
      .min(1)
      .max(chatLimits.answer)
      .describe(
        "The answer, which comes in word by word after the request. Under 120 characters reads best.",
      ),
    names: z
      .strictObject({
        request: z
          .string()
          .max(chatLimits.name)
          .optional()
          .describe("The name above the request, for example You.")
          .meta({ title: "Name of the person" }),
        answer: z
          .string()
          .max(chatLimits.name)
          .optional()
          .describe("The name above the answer, for example the product name.")
          .meta({ title: "Name of the product" }),
      })
      .optional()
      .describe("Optional small names above the two bubbles."),
  }),
};
