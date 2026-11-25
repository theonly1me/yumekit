import {
  checkModeOf,
  type Asset,
  type ProjectSnapshot,
  type Shot,
  type StoryPlan,
} from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure } from "../results.js";
import { shotNeedsDesign } from "./designGate.js";
import { refusalsOf } from "./shotRefusals.js";
import { waitsForShotFailure } from "./waitsForShot.js";

export function clipEndIdOf(shot: Shot): string | undefined {
  const checked = (shot.designChecks ?? []).findLast(
    (check) => check.endPictureAssetId !== undefined,
  )?.endPictureAssetId;
  if (checked !== undefined) return checked;
  return (shot.reviews ?? []).findLast(
    (review) =>
      review.by === "critic" && review.endPictureAssetId !== undefined,
  )?.endPictureAssetId;
}

export function startsFromPlanOf(options: {
  snapshot: ProjectSnapshot;
  before: Shot;
}): boolean {
  const { snapshot, before } = options;
  if (refusalsOf({ shot: before }).length > 0) return true;
  return (
    checkModeOf(snapshot.project) === "draft" &&
    !shotNeedsDesign({ snapshot, shot: before })
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
  const pictureId = before === undefined ? undefined : clipEndIdOf(before);
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
}): HarnessFailure | undefined {
  const { shot, snapshot } = options;
  const before = continuedShotOf(options);
  if (before === undefined) return undefined;
  const pictureId = clipEndIdOf(before);
  if (pictureId === undefined) {
    return startsFromPlanOf({ snapshot, before })
      ? undefined
      : waitsForShotFailure({ shot, before });
  }
  if (usesPicture({ ...options, pictureId })) return undefined;
  return {
    kind: "continuity-picture-missing",
    message: `Shot "${shot.id}" continues the last frame of "${before.id}" (continues_shot), so it starts on the end picture "${pictureId}". The call does not use it.`,
    hint: `Give first_frame_asset_id "${pictureId}", or use a start picture that was made with "${pictureId}" in reference_asset_ids. For a cut to a new camera instead, remove continues_shot from "${shot.id}" with set_story_plan.`,
  };
}
