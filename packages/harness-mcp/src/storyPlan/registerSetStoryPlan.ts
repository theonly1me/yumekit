import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { failureResult } from "../results.js";
import { planWarningsOf } from "./planWarnings.js";
import {
  repeatedShotIdOf,
  setStoryPlanInput,
  storyPlanOf,
} from "./storyPlanInput.js";

export function registerSetStoryPlan(context: HarnessContext): void {
  context.tools.add({
    name: "set_story_plan",
    description:
      "Write the story plan of a film before any paid picture or clip: the logline, what the main character wants, what stands against it, what changes by the end, and the shots in film order. Each shot has its purpose, ONE action with its result, its place (a cast entry of kind place), its cast, the camera, its length, and where each person and object is at the start and at the end. A video clip of an ai-video or mix project, or of a project with a plan, needs shot_id in generate_asset. The call replaces the whole plan and keeps the clip reviews of each shot id that stays. It returns warnings: a shot that starts in another state than the shot before in the same place, a shot where nothing changes, an action that only walks or looks, a shot that gives the next one nothing, more than two places, and cast entries that do not exist yet. Correct each warning, unless the story needs it. Read get_story_guide first.",
    inputSchema: setStoryPlanInput,
    run: async ({ input }) => {
      const repeated = repeatedShotIdOf(input);
      if (repeated !== undefined) {
        return failureResult({
          kind: "id-in-use",
          message: `The plan has the shot id "${repeated}" twice.`,
          hint: "Give each shot its own id.",
        });
      }
      const { bible } = context.store.read();
      const plan = storyPlanOf({ input, earlier: bible.storyPlan });
      const warnings = planWarningsOf({ plan, cast: bible.cast });
      const warningText =
        warnings.length === 0
          ? "No warnings."
          : `${String(warnings.length)} warnings: ${warnings.join(" ")}`;
      return applyEditsResult({
        store: context.store,
        edits: [{ kind: "setBible", bible: { ...bible, storyPlan: plan } }],
        line: `Story plan saved with ${String(plan.shots.length)} shots. ${warningText}`,
        data: {
          shot_ids: plan.shots.map((shot) => shot.id),
          warnings,
        },
      });
    },
  });
}
