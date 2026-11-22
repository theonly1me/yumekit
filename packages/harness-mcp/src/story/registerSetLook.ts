import { looks, lookIds } from "@yumekit/scene-kit/schemas";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";

const lookLines = looks.map((look) => `${look.id}: ${look.line}`).join(" ");

export function registerSetLook(context: HarnessContext): void {
  context.tools.add({
    name: "set_look",
    description: `Change the look of the project: the colors, the fonts, and the backdrop of each kit scene, and of each custom scene that reads useStylePack. One call is one undo step. Use the look that the person asks for. The looks: ${lookLines}`,
    inputSchema: {
      look: z.enum(lookIds).describe("The id of the look."),
    },
    run: ({ input: { look } }) =>
      applyEditsResult({
        store: context.store,
        edits: [{ kind: "setLook", look }],
        line: `The look is now ${look}.`,
        data: { look },
      }),
  });
}
