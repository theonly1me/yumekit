import { defaultLookId, lookLimits, lookSheetKinds } from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../inputs.js";

const lookText = z.string().trim().min(1).max(lookLimits.characters);

export const personWordsInput = z.string().trim().min(1).max(1000);

export const lookSheetInput = z.strictObject({
  asset_id: idInput("An image asset of this look."),
  kind: z
    .enum(lookSheetKinds)
    .describe(
      "turnaround: front, side, back, and the face close up (one for each look). expressions: the face in the moods of the film. poses: the action poses that the shots need. hands-props: the hands with each prop.",
    ),
  poses: z
    .array(lookText)
    .max(lookLimits.items)
    .optional()
    .describe(
      "For a poses sheet: the name of each pose on it, as get_work proposes them. Leave it out to take the poses of the generate_asset call that made the picture.",
    ),
});

export const lookInput = z.strictObject({
  look_id: idInput(
    `The id of the look. Each person has the look "${defaultLookId}": the design. Another look is a change of clothes that the person decided.`,
  ),
  name: z
    .string()
    .trim()
    .min(1)
    .describe("The name of the look, for example 'Travel clothes'."),
  clothes: z
    .array(lookText)
    .max(lookLimits.items)
    .describe(
      "Each garment, one each, with its construction, color, and cut, for example 'a long sleeveless indigo coat worn open over a sleeved slate-grey kimono'. Name what a garment does not have when a model adds it often: 'no sleeves on the coat'.",
    ),
  props: z
    .array(
      z.strictObject({
        name: lookText.describe(
          "The prop, for example 'sword in a black scabbard'.",
        ),
        count: z
          .int()
          .min(0)
          .max(lookLimits.propCount)
          .describe("How many of it the person carries. 0 for 'never any'."),
        side: z
          .string()
          .trim()
          .max(lookLimits.characters)
          .describe(
            "Where and on which side, for example 'through the sash on his left hip'.",
          ),
      }),
    )
    .max(lookLimits.items)
    .describe("Each prop that the person carries in this look."),
  sheets: z
    .array(lookSheetInput)
    .max(lookLimits.sheets)
    .optional()
    .describe(
      `The sheets of this look. The turnaround and the hands of the look "${defaultLookId}" are the pictures of the entry (reference_asset_ids). Leave it out to keep the sheets of a look that exists.`,
    ),
  person_asked_for_it: personWordsInput
    .optional()
    .describe(
      `The words of the person that ask for this look, from the request or a message, for example 'In the last scene she wears her wedding dress'. A new look other than "${defaultLookId}" needs them: propose the look to the person and ask first, unless the request already describes it.`,
    ),
});

export type LookInput = z.infer<typeof lookInput>;

export const looksInput = z
  .array(lookInput)
  .max(lookLimits.looks)
  .optional()
  .describe(
    `For a person of a film: the looks. The facts above are the base facts of the person (face, eyes, hair, marks, build), which no look changes. A look is a named set of clothes and props with its own sheets. Give the look "${defaultLookId}" for the design. Each shot names the look of each person (cast_looks of set_story_plan), and the design check compares each picture and clip with that look. Leave it out to keep the looks.`,
  );
