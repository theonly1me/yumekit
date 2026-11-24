import type { SheetTry } from "@yumekit/project";
import { bestSheetTryOf } from "../../storyPlan/sheetTryGate.js";
import { tryStepOf } from "../../storyPlan/tryRules.js";

export function sheetNextStepOf(options: {
  castId: string;
  tries: SheetTry[];
}): string {
  const { castId, tries } = options;
  const last = tries.at(-1);
  if (last?.verdict === "pass") return "The sheet can be used.";
  const refused = tries.filter((entry) => entry.verdict === "fail");
  const step = tryStepOf(refused.length);
  if (step === "refine") {
    return `Second try: generate_asset with sheet_of "${castId}", the refused picture in reference_asset_ids, and "keep everything of the reference and change only:" each blocking fault. Then review it again.`;
  }
  if (step === "simplify") {
    return `Refused twice. One simplified try is left: give simpler_form and use a simpler form from the known limits of get_story_guide. If both refusals had the same cause, record it with record_lesson and is_limit true.`;
  }
  const best = bestSheetTryOf(tries);
  return `The tries are used up. Use the best version (${best?.assetIds.join(" and ") ?? "the last one"}) with put_cast_member and restrictions that keep the film away from its faults, then call review_plan again. Or ask the person.`;
}
