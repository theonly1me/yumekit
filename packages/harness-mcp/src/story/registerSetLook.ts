import { isCalm, lookOf, type Edit } from "@yumekit/project";
import { looks, lookIds } from "@yumekit/scene-kit/schemas";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { failureResult } from "../results.js";
import { contrastWarningsOf, ownColorsInput } from "./ownLookInput.js";

const lookLines = looks.map((look) => `${look.id}: ${look.line}`).join(" ");

const setLookInput = {
  look: z.enum(lookIds).optional().describe("The id of the look."),
  calm: z
    .boolean()
    .optional()
    .describe(
      "true: kit scenes fade in with no move. false: the usual motion. A project with no value is not calm.",
    ),
  colors: z
    .union([ownColorsInput, z.null()])
    .optional()
    .describe(
      "The own colors of the person, for example the colors of a brand or an app. They replace the colors of the look in each kit scene and in custom scenes that read useStylePack. null goes back to the colors of the look.",
    ),
  font: z
    .union([z.string().min(1).max(64), z.null()])
    .optional()
    .describe(
      "The family of a project font (set_fonts) for the text of each kit scene. null goes back to the fonts of the look.",
    ),
};

type SetLookInput = z.infer<z.ZodObject<typeof setLookInput>>;

function setLookEdit(options: {
  input: SetLookInput;
  look: Extract<Edit, { kind: "setLook" }>["look"];
}): Edit {
  const { input } = options;
  return {
    kind: "setLook",
    look: options.look,
    ...(input.calm === undefined ? {} : { calm: input.calm }),
    ...(input.colors === undefined ? {} : { colors: input.colors }),
    ...(input.font === undefined ? {} : { font: input.font }),
  };
}

export function registerSetLook(context: HarnessContext): void {
  context.tools.add({
    name: "set_look",
    description: `Change the look of the project: the colors, the fonts, and the backdrop of each kit scene, and of each custom scene that reads useStylePack. When the person gives colors or a font (a brand, the look of an app), give them as colors and font: the kit scenes then draw in them, with their layout and motion, and need no custom code. calm true makes each kit scene fade in with no move, for a calm video. Give the parts to change; the others keep their value. One call is one undo step. The looks: ${lookLines}`,
    inputSchema: setLookInput,
    run: ({ input }) => {
      const { project } = context.store.read();
      const isEmpty = Object.values(input).every(
        (value) => value === undefined,
      );
      if (isEmpty) {
        return failureResult({
          kind: "invalid-value",
          message: "set_look needs look, calm, colors, or font.",
          hint: `Give a look id (${lookIds.join(", ")}), calm true or false, colors, or a font family.`,
        });
      }
      const look = input.look ?? lookOf(project);
      const calm = input.calm ?? isCalm(project);
      const warnings =
        input.colors === undefined || input.colors === null
          ? []
          : contrastWarningsOf(input.colors);
      return applyEditsResult({
        store: context.store,
        edits: [setLookEdit({ input, look })],
        line: [
          `The look is now ${look}${calm ? ", calm" : ""}.`,
          ...warnings,
        ].join(" "),
        data: { look, calm, warnings },
        hints: {
          "not-found":
            "Load the font file for the whole video with set_fonts first, or give look_font to set_fonts.",
        },
      });
    },
  });
}
