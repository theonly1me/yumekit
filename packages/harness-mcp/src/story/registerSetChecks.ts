import { checkModes } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";

export const checkModeMeanings =
  'In "draft" (the default), you check the design of each picture and clip yourself with check_design, and the critic looks only when the person asks for a second look. In "critic", review_start and review_clip check each picture and clip with the critic. In both, only a break of the design blocks a result, and every other fault is a note.';

export function registerSetChecks(context: HarnessContext): void {
  context.tools.add({
    name: "set_checks",
    description: `Change how the work of a film is checked. The person picks it in Settings, so call this only when the person asks. ${checkModeMeanings} One call is one undo step.`,
    inputSchema: {
      checks: z.enum(checkModes).describe("draft or critic."),
    },
    run: ({ input: { checks } }) =>
      applyEditsResult({
        store: context.store,
        edits: [{ kind: "setChecks", checks }],
        line: `The checks are ${checks}. ${checkModeMeanings}`,
        data: { checks },
      }),
  });
}
