import { castKinds } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";

const castMemberInput = z.strictObject({
  id: idInput("The id of the cast member."),
  kind: z
    .enum(castKinds)
    .optional()
    .describe("A person, a place, a product, or a prop. Default person."),
  name: z.string().describe("The name of the cast member."),
  description: z
    .string()
    .describe(
      "How the cast member looks. The harness adds it to each prompt that gives its id in cast_ids.",
    ),
  reference_asset_ids: z
    .array(idInput("An image asset that shows the cast member."))
    .max(4)
    .optional()
    .describe("Up to 4 image assets that show the cast member. Default none."),
});

export function registerSetBible(context: HarnessContext): void {
  context.tools.add({
    name: "set_bible",
    description:
      "Replace the bible: the art direction, the palette, the cast, and the voice. The harness adds the style as the art direction to each picture and video prompt, so do not repeat it there. The story plan stays.",
    inputSchema: {
      style: z
        .string()
        .describe(
          "The art direction of each picture and video clip, in two to four sentences: the medium, the line, the color, the light, the lens, and what never appears. For example 'Hand-painted 2D animation with soft ink lines. Warm muted colors with one red accent. Low golden evening light, 35 mm lens, shallow depth. No neon, no text on walls.'",
        ),
      palette: z
        .array(z.string())
        .describe("Colors as CSS hex values, for example #18203a."),
      cast: z
        .array(castMemberInput)
        .optional()
        .describe(
          "The people, places, products, and props that show in two or more scenes. It replaces the whole cast, and an entry with the same id keeps its facts. Leave it out to keep the cast. To change one entry, call put_cast_member.",
        ),
      voice: z
        .string()
        .describe(
          "How the narration sounds, for example 'warm, calm, medium pace'.",
        ),
    },
    run: ({ input: { style, palette, cast, voice } }) => {
      const { storyPlan, cast: earlierCast } = context.store.read().bible;
      return applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "setBible",
            bible: {
              ...(storyPlan === undefined ? {} : { storyPlan }),
              style,
              palette,
              voice,
              cast:
                cast === undefined
                  ? earlierCast
                  : cast.map((member) => {
                      const facts = earlierCast.find(
                        (earlier) => earlier.id === member.id,
                      )?.facts;
                      return {
                        id: member.id,
                        kind: member.kind ?? "person",
                        name: member.name,
                        description: member.description,
                        ...(facts === undefined ? {} : { facts }),
                        referenceAssetIds: member.reference_asset_ids ?? [],
                      };
                    }),
            },
          },
        ],
        line: "Bible set.",
      });
    },
  });
}
