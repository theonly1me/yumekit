import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { cueSheetOf, musicMapOf } from "../music/musicMap.js";
import { failureResult } from "../results.js";
import { planBudgetWith } from "./planCost.js";
import { planWarningsOf } from "./planWarnings.js";
import { planStoryNotesOf } from "../storyFirst/planStoryNotes.js";
import { planRefusalOf } from "./planRefusal.js";
import { setStoryPlanInput, storyPlanOf } from "./storyPlanInput.js";

export function registerSetStoryPlan(context: HarnessContext): void {
  context.tools.add({
    name: "set_story_plan",
    description:
      "Write the story plan of a film before any paid picture or clip, after the whole story (set_story): its form, the logline, what the main character wants, what stands against it, what changes, and the shots in film order. Each shot has its purpose, ONE action with its result, its place, its cast, the camera (size, angle, lens, move), its length, the start and end entries (one for each person and prop: where, screen side, facing, who holds it in which hand, state, and where it enters from), its strikes (target, contact, reaction, and the source and path of each effect), the music intensity and hits, the prompts of its start picture and its clip as you will send them, and story_fact, the part of the story that it shows. review_plan is a second look of the critic when the person asks for one: its faults are notes, and no picture or clip waits for it. A video clip of a film needs shot_id in generate_asset. It warns before the money when the planned seconds with one retry of the two longest shots pass the video limit of the project, or the cost estimate passes its spending limit; only the person can raise a limit. The call replaces the whole plan and keeps the reviews of each shot id that stays. It refuses states that miss a person or a prop. It returns the music cue sheet and warnings: a cut that moves a character, a character that comes from nowhere, repeated framing, a first shot that does not start inside an action, a strike with no target, more than two opponents, a fight with no close strike, a shot where nothing changes, a walk, and more than two places. It gives notes, never a refusal, for a plan with no story behind it, a plan with no form, and a shot whose spoken line or text has no story_fact. Split a film that is too long to make at once into chapters of about 1 to 3 minutes, and tell the person the split in one short message. Read get_story_guide first.",
    inputSchema: setStoryPlanInput,
    run: async ({ input }) => {
      const refusal = planRefusalOf(input);
      if (refusal !== undefined) return failureResult(refusal);
      const { bible } = context.store.read();
      const written = storyPlanOf({ input, earlier: bible.storyPlan });
      const budget = await planBudgetWith({
        mediaTools: context.mediaTools,
        bible,
        plan: written,
      });
      const plan = { ...written, costEstimateUsd: budget.estimateUsd ?? 0 };
      const warnings = planWarningsOf({ plan, cast: bible.cast });
      const warningText =
        warnings.length === 0
          ? "No warnings."
          : `${String(warnings.length)} warnings: ${warnings.join(" ")}`;
      const money =
        budget.warnings.length === 0
          ? ""
          : `\nBefore the money: ${budget.warnings.join(" ")}`;
      const cueSheet = cueSheetOf(musicMapOf({ plan }));
      const notes = planStoryNotesOf({ plan, story: bible.story });
      const noteText = notes.length === 0 ? "" : `\n${notes.join("\n")}`;
      return applyEditsResult({
        store: context.store,
        edits: [{ kind: "setBible", bible: { ...bible, storyPlan: plan } }],
        line: `Story plan saved with ${String(plan.shots.length)} shots. ${warningText}${money}${noteText}\nThe music map, for the music prompt (add the end card):\n${cueSheet}`,
        data: {
          shot_ids: plan.shots.map((shot) => shot.id),
          ...(plan.chapters === undefined
            ? {}
            : {
                chapters: plan.chapters.map((chapter) => ({
                  chapter_id: chapter.id,
                  shot_ids: chapter.shotIds,
                })),
              }),
          warnings,
          story_notes: notes,
          budget_warnings: budget.warnings,
          cost_estimate_usd: budget.estimateUsd,
          music_cue_sheet: cueSheet,
        },
      });
    },
  });
}
