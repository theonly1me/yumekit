import { z } from "zod";

export const trailerCardLimits = {
  line: 60,
  lines: 2,
  scale: { minimum: 0.5, maximum: 2 },
  tracking: { minimum: 0, maximum: 0.6 },
  landsOnBeat: 16,
  storyFact: 64,
} as const;

export const trailerCardVariants = ["card", "title"] as const;

export const trailerCardFaces = ["display", "body"] as const;

export const trailerCardBackgrounds = ["black", "look"] as const;

export const trailerCardLine = z
  .string()
  .min(1)
  .max(trailerCardLimits.line)
  .describe("One short line of the card, 2 to 7 words.");

export const trailerCardSchema = {
  purpose:
    "A cinematic card between the shots of a trailer or a film: black (or a still behind), one or two short lines in a display face with wide tracking, a fast fade in, a slow push, a hard cut out, and an optional one-frame flash on the beat. variant title is the larger card with the name of the film, for the end. Each line comes from the story: give storyFact. Lands on beat landsOnBeat of its clip; place the clip so that beat is a hit of the music (check_music lists the hits).",
  props: z.strictObject({
    lines: z
      .array(trailerCardLine)
      .min(1)
      .max(trailerCardLimits.lines)
      .describe(
        "1 or 2 lines. For the title variant, line 1 is the name of the film and line 2 a smaller line under it.",
      ),
    variant: z
      .enum(trailerCardVariants)
      .optional()
      .describe(
        "card (the default) for a line between shots, or title for the name of the film, larger.",
      ),
    face: z
      .enum(trailerCardFaces)
      .optional()
      .describe(
        "The font: display (the default) or body, of the look or of set_fonts look_font.",
      ),
    scale: z
      .number()
      .min(trailerCardLimits.scale.minimum)
      .max(trailerCardLimits.scale.maximum)
      .optional()
      .describe("The size against the default of the variant, 0.5 to 2."),
    tracking: z
      .number()
      .min(trailerCardLimits.tracking.minimum)
      .max(trailerCardLimits.tracking.maximum)
      .optional()
      .describe(
        "The space between letters in em, 0 to 0.6. The default is 0.28 for a card and 0.14 for a title.",
      ),
    capitals: z
      .boolean()
      .optional()
      .describe("true (the default) draws the lines in capital letters."),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional()
      .describe(
        "The color of the words as #rrggbb. The default is the text color of the look when it reads on the background, else a warm white.",
      ),
    background: z
      .enum(trailerCardBackgrounds)
      .optional()
      .describe(
        "black (the default) or look, the background color of the look.",
      ),
    backgroundAssetId: z
      .string()
      .optional()
      .describe(
        "A picture or video asset to show behind the words, darkened, as a still frame from its start.",
      )
      .meta({ title: "Still behind", assetKinds: ["image", "video"] }),
    landsOnBeat: z
      .number()
      .min(0)
      .max(trailerCardLimits.landsOnBeat)
      .optional()
      .describe(
        "The beat of the clip where the words appear, in whole or half beats from its start. The default is 0. Before it, the card is black.",
      ),
    holdSeconds: z
      .number()
      .gt(0)
      .optional()
      .describe(
        "How long the words stay after they appear. Then a hard cut to black until the clip ends. The default is the rest of the clip.",
      ),
    flash: z
      .boolean()
      .optional()
      .describe(
        "true draws a one-frame white flash on the frame where the words appear.",
      ),
    storyFact: z
      .string()
      .max(trailerCardLimits.storyFact)
      .optional()
      .describe(
        "The id of the part of the story (set_story) that this card says. It does not draw.",
      ),
  }),
};
