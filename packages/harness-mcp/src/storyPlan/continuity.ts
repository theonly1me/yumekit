import type { ClipReview, ProjectSnapshot, StoryPlan } from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure } from "../results.js";

export function keptReviewOf(reviews: ClipReview[] | undefined) {
  return (reviews ?? []).findLast(
    (review) => review.verdict === "keep" || review.verdict === "cut",
  );
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
}): HarnessFailure | undefined {
  const shot = options.plan.shots[options.index];
  const before = options.plan.shots[options.index - 1];
  if (shot === undefined || before === undefined) return undefined;
  if (before.placeId !== shot.placeId) return undefined;
  const pictureId = keptReviewOf(before.reviews)?.endPictureAssetId;
  if (pictureId === undefined) return undefined;
  if (usesPicture({ ...options, pictureId })) return undefined;
  return {
    kind: "continuity-picture-missing",
    message: `Shot "${shot.id}" is in the same place as "${before.id}", so it starts where "${before.id}" ended. The call does not use the end picture "${pictureId}".`,
    hint: `Give first_frame_asset_id "${pictureId}", or put "${pictureId}" in reference_asset_ids, or use a start picture that was made with it as a reference.`,
  };
}
