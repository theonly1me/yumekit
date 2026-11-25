import type { DesignCheck, ProjectSnapshot, Shot } from "@yumekit/project";
import { personWordsInput } from "../cast/lookInput.js";
import { shotDesignJobOf } from "../critic/design/designJob.js";
import { designCheckOf } from "../critic/design/designRecord.js";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure } from "../results.js";
import { endPictureTool } from "./endPicture.js";

export const shortestCleanSeconds = 1.2;

export const personChoseThisPictureInput = personWordsInput
  .optional()
  .describe(
    "The words of the person that choose the start or end picture of this clip although its design is not checked or the design check found a break, as the person wrote them. Give it only when the person chose the picture. The choice is stored with the picture as the decision of the person.",
  );

export function isOpen(check: DesignCheck): boolean {
  return check.breaks.length === 0 || check.personKept !== undefined;
}

export function shotNeedsDesign(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
}): boolean {
  const { snapshot, shot } = options;
  return (
    shotDesignJobOf({
      snapshot,
      castIds: shot.castIds,
      castLooks: shot.castLooks,
      target: { kind: "pictures", pictures: [] },
    }) !== undefined
  );
}

export function keyPictureIdsOf(request: GenerateAssetInput): string[] {
  return [request.first_frame_asset_id, request.last_frame_asset_id].flatMap(
    (id) => (id === undefined ? [] : [id]),
  );
}

export function isSavedClipEnd(options: {
  snapshot: ProjectSnapshot;
  assetId: string;
}): boolean {
  const asset = options.snapshot.assets.find(
    (candidate) => candidate.id === options.assetId,
  );
  return asset?.source.kind === "tool" && asset.source.tool === endPictureTool;
}

export function designNotChecked(options: {
  shotId: string;
  assetIds: string[];
  what: "picture" | "clip";
}): HarnessFailure {
  const { shotId, assetIds, what } = options;
  const named = assetIds.map((id) => `"${id}"`).join(" and ");
  return {
    kind: "design-not-checked",
    message:
      what === "picture"
        ? `The design of ${named} has no check yet. A start or end picture becomes an exact frame of the clip of shot "${shotId}", so its design is checked first.`
        : `The design of the clip ${named} of shot "${shotId}" has no check yet, so the film cannot show it.`,
    hint:
      what === "picture"
        ? `Call check_design for ${named} (one call can check a whole batch), or review_start with the critic. Only when the person chose the picture, give their words in person_chose_this_picture.`
        : `Call check_design for ${named} (one call can check a whole batch), or review_clip with the critic. Only when the person chose the clip, give their words in person_chose_this_clip of place_video.`,
  };
}

export function keyPictureFailureOf(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
  request: GenerateAssetInput;
}): HarnessFailure | undefined {
  const { snapshot, shot, request } = options;
  if (request.capability !== "video") return undefined;
  const ids = keyPictureIdsOf(request).filter(
    (assetId) => !isSavedClipEnd({ snapshot, assetId }),
  );
  if (ids.length === 0 || !shotNeedsDesign({ snapshot, shot })) {
    return undefined;
  }
  const unchecked = ids.filter(
    (assetId) => designCheckOf({ shot, assetId }) === undefined,
  );
  if (unchecked.length > 0) {
    return designNotChecked({
      shotId: shot.id,
      assetIds: unchecked,
      what: "picture",
    });
  }
  const broken = ids.flatMap((assetId) => {
    const check = designCheckOf({ shot, assetId });
    return check === undefined || isOpen(check) ? [] : [check];
  });
  if (broken.length === 0) return undefined;
  return {
    kind: "design-break",
    message: `The design check found a break in ${broken.map((check) => `"${check.assetId}" (${check.breaks.join("; ")})`).join(", ")}. A clip from it animates the wrong design.`,
    hint: "Make a new picture that matches the turnaround of the look, and check it. Only when the person chose this picture, give their words in person_chose_this_picture.",
  };
}
