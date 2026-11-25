import type {
  Asset,
  DesignCheck,
  Edit,
  ProjectSnapshot,
  Shot,
} from "@yumekit/project";
import { personWordsInput } from "../cast/lookInput.js";
import { designCheckOf } from "../critic/design/designRecord.js";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure } from "../results.js";
import { shotIdOf } from "./reviewGate.js";

export const shortestCleanSeconds = 1.2;

export const personChoseThisPictureInput = personWordsInput
  .optional()
  .describe(
    "The words of the person that choose the start or end picture of this clip although the design check found a break, as the person wrote them. Give it only when the person chose the picture. The choice is stored with the picture as the decision of the person.",
  );

function isOpen(check: DesignCheck | undefined): boolean {
  return (
    check === undefined ||
    check.breaks.length === 0 ||
    check.personKept !== undefined
  );
}

function keyPictureIdsOf(request: GenerateAssetInput): string[] {
  return [request.first_frame_asset_id, request.last_frame_asset_id].flatMap(
    (id) => (id === undefined ? [] : [id]),
  );
}

export function keyPictureFailureOf(options: {
  shot: Shot;
  request: GenerateAssetInput;
}): HarnessFailure | undefined {
  const { shot, request } = options;
  if (request.capability !== "video") return undefined;
  const first = request.first_frame_asset_id;
  const last = request.last_frame_asset_id;
  if (last !== undefined) {
    const review = (shot.startReviews ?? []).find(
      (entry) => entry.assetId === first && entry.endPictureAssetId === last,
    );
    if (review?.verdict !== "pass") {
      return {
        kind: "end-not-reviewed",
        message: `The end picture "${last}" becomes the exact last frame of the clip, and the critic has not passed it with the start picture "${first ?? "none"}" of shot "${shot.id}".`,
        hint: `Call review_start with asset_id "${first ?? "<the start picture>"}", shot_id "${shot.id}", and end_picture_asset_id "${last}" first.`,
      };
    }
  }
  const broken = keyPictureIdsOf(request).flatMap((assetId) => {
    const check = designCheckOf({ shot, assetId });
    return isOpen(check) || check === undefined ? [] : [check];
  });
  if (broken.length === 0) return undefined;
  return {
    kind: "design-break",
    message: `The design check found a break in ${broken.map((check) => `"${check.assetId}" (${check.breaks.join("; ")})`).join(", ")}. A clip from it animates the wrong design.`,
    hint: "Make a new picture that matches the turnaround of the look, and review it. Only when the person chose this picture, give their words in person_chose_this_picture.",
  };
}

function shotOfAsset(options: {
  snapshot: ProjectSnapshot;
  asset: Asset;
}): Shot | undefined {
  const shotId = shotIdOf(options.asset);
  return options.snapshot.bible.storyPlan?.shots.find(
    (shot) => shot.id === shotId,
  );
}

function withPersonChoice(options: {
  snapshot: ProjectSnapshot;
  shotId: string;
  assetIds: string[];
  words: string;
}): { snapshot: ProjectSnapshot; edits: Edit[] } {
  const { snapshot, shotId, assetIds, words } = options;
  const plan = snapshot.bible.storyPlan;
  const shot = plan?.shots.find((candidate) => candidate.id === shotId);
  const chosen = assetIds.filter((assetId) => {
    const check =
      shot === undefined ? undefined : designCheckOf({ shot, assetId });
    return !isOpen(check);
  });
  if (plan === undefined || chosen.length === 0) {
    return { snapshot, edits: [] };
  }
  const bible = {
    ...snapshot.bible,
    storyPlan: {
      ...plan,
      shots: plan.shots.map((candidate) =>
        candidate.id !== shotId
          ? candidate
          : {
              ...candidate,
              designChecks: (candidate.designChecks ?? []).map((check) =>
                chosen.includes(check.assetId)
                  ? { ...check, personKept: { words } }
                  : check,
              ),
            },
      ),
    },
  };
  return {
    snapshot: { ...snapshot, bible },
    edits: [{ kind: "setBible", bible }],
  };
}

export function withChosenPictures(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): { snapshot: ProjectSnapshot; edits: Edit[] } {
  const { snapshot, request } = options;
  const words = request.person_chose_this_picture;
  if (words === undefined || request.shot_id === undefined) {
    return { snapshot, edits: [] };
  }
  return withPersonChoice({
    snapshot,
    shotId: request.shot_id,
    assetIds: keyPictureIdsOf(request),
    words,
  });
}

export function withChosenClip(options: {
  snapshot: ProjectSnapshot;
  asset: Asset;
  words: string | undefined;
}): { snapshot: ProjectSnapshot; edits: Edit[] } {
  const { snapshot, asset, words } = options;
  const shotId = shotIdOf(asset);
  if (words === undefined || shotId === undefined) {
    return { snapshot, edits: [] };
  }
  return withPersonChoice({ snapshot, shotId, assetIds: [asset.id], words });
}

export function designRangeFailureOf(options: {
  snapshot: ProjectSnapshot;
  asset: Asset;
  shownFrames: number;
}): HarnessFailure | undefined {
  const { snapshot, asset } = options;
  const shot = shotOfAsset({ snapshot, asset });
  const check =
    shot === undefined ? undefined : designCheckOf({ shot, assetId: asset.id });
  const keptWhole = (shot?.reviews ?? []).some(
    (review) => review.assetId === asset.id && review.personKept !== undefined,
  );
  if (check === undefined || isOpen(check) || keptWhole) return undefined;
  const { framesPerSecond } = snapshot.project;
  const cleanUntil = check.cleanUntilSeconds ?? 0;
  const cleanFrames = Math.floor(cleanUntil * framesPerSecond);
  if (
    cleanUntil >= shortestCleanSeconds &&
    options.shownFrames <= cleanFrames + 1
  ) {
    return undefined;
  }
  const breaks = check.breaks.join("; ");
  return {
    kind: "design-break-in-range",
    message:
      cleanUntil < shortestCleanSeconds
        ? `The design of the clip "${asset.id}" breaks after ${String(cleanUntil)}s (${breaks}). A clean part under ${String(shortestCleanSeconds)} seconds is too short to place.`
        : `The design of the clip "${asset.id}" breaks after ${String(cleanUntil)}s (${breaks}), and this placement shows ${String(Math.round((options.shownFrames / framesPerSecond) * 100) / 100)}s of it.`,
    hint:
      cleanUntil < shortestCleanSeconds
        ? "Make the clip again from a checked start picture, with a prompt that names what must not change. Only when the person chose this clip, give their words in person_chose_this_clip."
        : `Give duration_frames of at most ${String(cleanFrames)}, so only the clean part shows. Only when the person chose the whole clip, give their words in person_chose_this_clip.`,
  };
}
