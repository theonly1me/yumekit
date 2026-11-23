import { isCalm, lookOf } from "@yumekit/project";
import { looks, lookIds } from "@yumekit/scene-kit/schemas";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { failureResult } from "../results.js";

const lookLines = looks.map((look) => `${look.id}: ${look.line}`).join(" ");

export function registerSetLook(context: HarnessContext): void {
  context.tools.add({
    name: "set_look",
    description: `Change the look of the project: the colors, the fonts, and the backdrop of each kit scene, and of each custom scene that reads useStylePack. calm true makes each kit scene fade in with no move, for a calm video. Give look, calm, or both; the other keeps its value. One call is one undo step. Use the look that the person asks for. The looks: ${lookLines}`,
    inputSchema: {
      look: z.enum(lookIds).optional().describe("The id of the look."),
      calm: z
        .boolean()
        .optional()
        .describe(
          "true: kit scenes fade in with no move. false: the usual motion. A project with no value is not calm.",
        ),
    },
    run: ({ input }) => {
      const { project } = context.store.read();
      if (input.look === undefined && input.calm === undefined) {
        return failureResult({
          kind: "invalid-value",
          message: "set_look needs look, calm, or both.",
          hint: `Give a look id (${lookIds.join(", ")}) or calm true or false.`,
        });
      }
      const look = input.look ?? lookOf(project);
      const calm = input.calm ?? isCalm(project);
      return applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "setLook",
            look,
            ...(input.calm === undefined ? {} : { calm: input.calm }),
          },
        ],
        line: `The look is now ${look}${calm ? ", calm" : ""}.`,
        data: { look, calm },
      });
    },
  });
}
