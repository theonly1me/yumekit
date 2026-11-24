import type { Shot, StoryPlan } from "@yumekit/project";

function reviewText(shot: Shot): string {
  const reviews = shot.reviews ?? [];
  if (reviews.length === 0) return "No reviewed clip.";
  return reviews
    .map((review) => {
      const part =
        review.keepFromSeconds === undefined ||
        review.keepToSeconds === undefined
          ? ""
          : ` ${String(review.keepFromSeconds)}s to ${String(review.keepToSeconds)}s`;
      const faults =
        review.faults.length === 0
          ? ""
          : ` Faults: ${review.faults.join("; ")}.`;
      const end =
        review.endPictureAssetId === undefined
          ? ""
          : ` End picture: ${review.endPictureAssetId}.`;
      return `Clip ${review.assetId}: ${review.verdict}${part}.${faults}${end}`;
    })
    .join(" ");
}

function shotLines(options: { shot: Shot; number: number }): string[] {
  const { shot } = options;
  const camera = [shot.camera.size, shot.camera.angle, shot.camera.move]
    .filter((part) => part !== undefined)
    .join(", ");
  return [
    `${String(options.number)}. ${shot.id} (${String(shot.seconds)}s, place ${shot.placeId}, cast ${shot.castIds.join(", ") || "none"}, camera ${camera})`,
    `   Purpose: ${shot.purpose}`,
    `   Action: ${shot.action}`,
    `   Start: ${shot.startState}`,
    `   End: ${shot.endState}`,
    `   Next shot inherits: ${shot.inherits === "" ? "nothing" : shot.inherits}`,
    `   ${reviewText(shot)}`,
  ];
}

export function planLines(plan: StoryPlan | undefined): string[] {
  if (plan === undefined) {
    return ["### Story plan", "(no story plan: set_story_plan writes one)"];
  }
  return [
    "### Story plan",
    `Logline: ${plan.logline}`,
    `Wants: ${plan.want}. Against it: ${plan.obstacle}. Changes: ${plan.change}`,
    ...plan.shots.flatMap((...[shot, index]) =>
      shotLines({ shot, number: index + 1 }),
    ),
  ];
}
