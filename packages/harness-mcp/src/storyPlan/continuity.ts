import type {
  Asset,
  ClipReview,
  ProjectSnapshot,
  StoryPlan,
} from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure } from "../results.js";

export function keptReviewOf(reviews: ClipReview[] | undefined) {
  return (reviews ?? []).findLast(
    (review) =>
      review.by === "critic" &&
      (review.verdict !== "redo" || review.personKept !== undefined),
  );
}

export function previousEndOf(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
  shotIndex: number;
}): Asset | undefined {
  const shot = options.plan.shots[options.shotIndex];
  const before = options.plan.shots[options.shotIndex - 1];
  if (shot === undefined || before?.placeId !== shot.placeId) return undefined;
  const pictureId = keptReviewOf(before.reviews)?.endPictureAssetId;
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

function usesPicture(options: {
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
  index: number;
  request: GenerateAssetInput;
  startsFromPlan: boolean;
}): HarnessFailure | undefined {
  const shot = options.plan.shots[options.index];
  const before = options.plan.shots[options.index - 1];
  if (shot === undefined || before === undefined) return undefined;
  if (before.placeId !== shot.placeId) return undefined;
  const kept = keptReviewOf(before.reviews);
  const pictureId = kept?.endPictureAssetId;
  if (pictureId === undefined) {
    if (options.startsFromPlan || kept?.personKept !== undefined) {
      return undefined;
    }
    return {
      kind: "previous-shot-not-kept",
      message: `Shot "${shot.id}" is in the same place as "${before.id}", so it starts where the kept clip of "${before.id}" ends. "${before.id}" has no clip that the critic kept yet.`,
      hint: `Make the clip of "${before.id}" and review it with review_clip first. Its end picture is then the start of "${shot.id}". When the critic refuses it, "${shot.id}" can start from the start state of the plan.`,
    };
  }
  if (usesPicture({ ...options, pictureId })) return undefined;
  return {
    kind: "continuity-picture-missing",
    message: `Shot "${shot.id}" is in the same place as "${before.id}", so it starts where "${before.id}" ended. The call does not use the end picture "${pictureId}".`,
    hint: `Give first_frame_asset_id "${pictureId}", or use a start picture that was made with "${pictureId}" in reference_asset_ids and passed review_start.`,
  };
}
