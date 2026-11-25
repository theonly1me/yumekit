import type {
  Asset,
  ClipReview,
  ProjectSnapshot,
  Shot,
  StoryPlan,
} from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure } from "../results.js";
import { waitsForShotFailure } from "./waitsForShot.js";

export function keptReviewOf(reviews: ClipReview[] | undefined) {
  return (reviews ?? []).findLast(
    (review) =>
      review.by === "critic" &&
      (review.verdict !== "redo" || review.personKept !== undefined),
  );
}

export function continuedShotOf(options: {
  plan: StoryPlan;
  shot: Shot;
}): Shot | undefined {
  const { continuesShotId } = options.shot;
  if (continuesShotId === undefined) return undefined;
  return options.plan.shots.find((shot) => shot.id === continuesShotId);
}

export function previousEndOf(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
  shotIndex: number;
}): Asset | undefined {
  const shot = options.plan.shots[options.shotIndex];
  const before =
    shot === undefined
      ? undefined
      : continuedShotOf({ plan: options.plan, shot });
  const pictureId = keptReviewOf(before?.reviews)?.endPictureAssetId;
  return options.snapshot.assets.find((asset) => asset.id === pictureId);
}

function referencesOf(options: {
  snapshot: ProjectSnapshot;
  assetId: string | undefined;
}): unknown[] {
  if (options.assetId === undefined) return [];
  const asset = options.snapshot.assets.find(
    (candidate) => candidate.id === options.assetId,
  );
  if (asset?.source.kind !== "tool") return [];
  const references = asset.source.input["reference_asset_ids"];
  return Array.isArray(references) ? references : [];
}

export function usesPicture(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
  pictureId: string;
}): boolean {
  const { request, pictureId } = options;
  return (
    request.first_frame_asset_id === pictureId ||
    (request.reference_asset_ids ?? []).includes(pictureId) ||
    referencesOf({
      snapshot: options.snapshot,
      assetId: request.first_frame_asset_id,
    }).includes(pictureId)
  );
}

export function continuityFailureOf(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
  shot: Shot;
  request: GenerateAssetInput;
  startsFromPlan: boolean;
}): HarnessFailure | undefined {
  const { shot } = options;
  const before = continuedShotOf(options);
  if (before === undefined) return undefined;
  const kept = keptReviewOf(before.reviews);
  const pictureId = kept?.endPictureAssetId;
  if (pictureId === undefined) {
    if (options.startsFromPlan || kept?.personKept !== undefined) {
      return undefined;
    }
    return waitsForShotFailure({ shot, before });
  }
  if (usesPicture({ ...options, pictureId })) return undefined;
  return {
    kind: "continuity-picture-missing",
    message: `Shot "${shot.id}" continues the last frame of "${before.id}" (continues_shot), so it starts on the end picture "${pictureId}". The call does not use it.`,
    hint: `Give first_frame_asset_id "${pictureId}", or use a start picture that was made with "${pictureId}" in reference_asset_ids and passed review_start. For a cut to a new camera instead, remove continues_shot from "${shot.id}" with set_story_plan.`,
  };
}
