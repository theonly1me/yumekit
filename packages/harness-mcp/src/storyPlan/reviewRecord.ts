import type { ClipReview, StoryPlan } from "@yumekit/project";
import type { ClipMotion } from "@yumekit/render";

export function measuresOf(motion: ClipMotion): ClipReview["measures"] {
  return {
    motion: motion.motion,
    worldMotion: motion.worldMotion,
    cameraMotion: motion.cameraMotion,
    ...(motion.startDifference === undefined
      ? {}
      : { startDifference: motion.startDifference.whole }),
    warnings: motion.warnings.map((warning) => warning.kind),
  };
}

export function planWithReview(options: {
  plan: StoryPlan;
  shotId: string;
  review: ClipReview;
}): StoryPlan {
  return {
    ...options.plan,
    shots: options.plan.shots.map((shot) =>
      shot.id === options.shotId
        ? {
            ...shot,
            reviews: [
              ...(shot.reviews ?? []).filter(
                (review) => review.assetId !== options.review.assetId,
              ),
              options.review,
            ],
          }
        : shot,
    ),
  };
}
