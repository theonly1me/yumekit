import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { cueSheetOf, musicMapOf } from "../music/musicMap.js";
import { failureResult } from "../results.js";
import { planWarningsOf } from "./planWarnings.js";
import {
  planRefusalOf,
  setStoryPlanInput,
  storyPlanOf,
} from "./storyPlanInput.js";

export function registerSetStoryPlan(context: HarnessContext): void {
  context.tools.add({
    name: "set_story_plan",
    description:
      "Write the story plan of a film before any paid picture or clip: the logline, what the main character wants, what stands against it, what changes, and the shots in film order. Each shot has its purpose, ONE action with its result, its place, its cast, the camera (size, angle, lens, move), its length, the start and end entries (one for each person and prop: where, screen side, facing, who holds it in which hand, state, and where it enters from), its strikes (target, contact, reaction, and the source and path of each effect), the music intensity and hits, and the prompts of its start picture and its clip as you will send them. Then call review_plan: no paid picture or clip runs before the critic passes the plan. A video clip of a film needs shot_id in generate_asset. The call replaces the whole plan and keeps the reviews of each shot id that stays. It refuses states that miss a person or a prop. It returns the music cue sheet and warnings: a cut that moves a character, a character that comes from nowhere, repeated framing, a first shot that does not start inside an action, a strike with no target, more than two opponents, a fight with no close strike, a shot where nothing changes, a walk, and more than two places. Read get_story_guide first.",
    inputSchema: setStoryPlanInput,
    run: async ({ input }) => {
      const refusal = planRefusalOf(input);
      if (refusal !== undefined) return failureResult(refusal);
      const { bible } = context.store.read();
      const plan = storyPlanOf({ input, earlier: bible.storyPlan });
      const warnings = planWarningsOf({ plan, cast: bible.cast });
      const warningText =
        warnings.length === 0
          ? "No warnings."
          : `${String(warnings.length)} warnings: ${warnings.join(" ")}`;
      const cueSheet = cueSheetOf(musicMapOf({ plan }));
      return applyEditsResult({
        store: context.store,
        edits: [{ kind: "setBible", bible: { ...bible, storyPlan: plan } }],
        line: `Story plan saved with ${String(plan.shots.length)} shots. ${warningText}\nThe music map, for the music prompt (add the end card):\n${cueSheet}`,
        data: {
          shot_ids: plan.shots.map((shot) => shot.id),
          warnings,
          music_cue_sheet: cueSheet,
        },
      });
    },
  });
}
