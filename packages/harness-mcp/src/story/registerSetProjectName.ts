import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";

export function registerSetProjectName(context: HarnessContext): void {
  context.tools.add({
    name: "set_project_name",
    description:
      "Give the project a short title in plain words, for example 'Hoshi tea ad'. The start screen and the editor show it. Call it once you know what the video is about.",
    inputSchema: {
      name: z
        .string()
        .trim()
        .min(1)
        .max(40)
        .describe("The title, 1 to 40 characters."),
    },
    run: ({ input: { name } }) =>
      applyEditsResult({
        store: context.store,
        edits: [{ kind: "setProjectName", name }],
        line: `The project is now called "${name}".`,
      }),
  });
}
