import type { ClipReview, ProjectSnapshot, Shot } from "@yumekit/project";
import { sourceTextOf } from "./tryRules.js";

export interface Refusal {
  assetId: string;
  kind: "clip" | "start";
  faults: string[];
}

type ReviewedShot = Pick<Shot, "reviews" | "startReviews">;

export function criticReviewsOf(shot: ReviewedShot): ClipReview[] {
  return (shot.reviews ?? []).filter((review) => review.by === "critic");
}

export function refusalsOf(options: {
  shot: ReviewedShot;
  order?: string[];
}): Refusal[] {
  const { shot } = options;
  const reviews = criticReviewsOf(shot);
  const accepted = new Set(
    reviews
      .filter((review) => review.verdict !== "redo")
      .map((review) => review.assetId),
  );
  const clips = new Map<string, Refusal>();
  for (const review of reviews) {
    if (review.verdict === "redo" && !accepted.has(review.assetId)) {
      clips.set(review.assetId, {
        assetId: review.assetId,
        kind: "clip",
        faults: review.faults,
      });
    }
  }
  const starts = (shot.startReviews ?? [])
    .filter((review) => review.verdict === "fail")
    .map((review) => ({
      assetId: review.assetId,
      kind: "start" as const,
      faults: review.faults,
    }));
  const order = options.order ?? [];
  const position = (refusal: Refusal) => order.indexOf(refusal.assetId);
  return [...clips.values(), ...starts].sort(
    (...[first, second]) => position(first) - position(second),
  );
}

export function refusedStartOf(options: {
  snapshot: ProjectSnapshot;
  refusal: Refusal | undefined;
}): string | undefined {
  const { refusal, snapshot } = options;
  if (refusal === undefined) return undefined;
  if (refusal.kind === "start") return refusal.assetId;
  const clip = snapshot.assets.find((asset) => asset.id === refusal.assetId);
  return clip === undefined
    ? undefined
    : sourceTextOf({ asset: clip, field: "first_frame_asset_id" });
}
