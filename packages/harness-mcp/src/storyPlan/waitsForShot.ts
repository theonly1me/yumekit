import type { Shot } from "@yumekit/project";
import type { HarnessFailure } from "../results.js";

export type WaitsForShotFailure = HarnessFailure & { waits_for_shot: string };

export function waitsForShotFailure(options: {
  shot: Shot;
  before: Shot;
}): WaitsForShotFailure {
  const { shot, before } = options;
  return {
    kind: "waits-for-shot",
    message: `Shot "${shot.id}" waits for shot "${before.id}". It continues the last frame of "${before.id}" (continues_shot), so it starts on the end picture of the checked clip of "${before.id}", and "${before.id}" has no checked clip yet.`,
    hint: `Make the clip of "${before.id}" and check its design with check_design (or review_clip with the critic): the check saves its end picture. Make the other shots of the batch now: they do not wait. For a cut to a new camera position instead, remove continues_shot from "${shot.id}" with set_story_plan.`,
    waits_for_shot: before.id,
  };
}
