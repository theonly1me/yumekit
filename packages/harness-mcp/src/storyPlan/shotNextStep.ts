import type { Shot } from "@yumekit/project";
import { refusalsOf } from "./shotRefusals.js";
import { tryStepOf } from "./tryRules.js";

export function shotNextStepOf(options: {
  shotId: string;
  reviews: NonNullable<Shot["reviews"]>;
  startReviews?: NonNullable<Shot["startReviews"]>;
}): string {
  const { shotId } = options;
  const refusals = refusalsOf({
    shot: {
      reviews: options.reviews,
      ...(options.startReviews === undefined
        ? {}
        : { startReviews: options.startReviews }),
    },
  });
  const step = tryStepOf(refusals.length);
  if (step === "refine") {
    return "You cannot overrule it. Second try: start from the refused version (its start picture as first_frame_asset_id, or a new start picture made with it in reference_asset_ids), and change only each blocking fault. If its cause will hit other shots, record it with record_lesson.";
  }
  if (step === "simplify") {
    return `Refused twice. One simplified try of "${shotId}" is left: give simpler_form and a simpler form from the known limits. If both refusals had the same cause, record it with record_lesson and is_limit true.`;
  }
  return `The tries of "${shotId}" are used up. Restage it as a new shot of the plan, or drop it, and call review_plan again; the next shots do not wait for it. Or ask the person.`;
}
