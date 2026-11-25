import type {
  Asset,
  DesignCheck,
  ProjectSnapshot,
  Shot,
  StartReview,
  StoryPlan,
} from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../../inputs.js";
import type { HarnessFailure, Outcome } from "../../results.js";
import { previousEndOf } from "../../storyPlan/continuity.js";
import { shotDesignJobOf } from "../design/designJob.js";
import { withDesignChecks } from "../design/designRecord.js";
import { planNoteLinesOf } from "../plan/planNoteLines.js";
import type { StartJob } from "./startJob.js";

export const reviewStartInput = {
  asset_id: idInput("The start picture to check."),
  shot_id: z.string().describe("The shot of the plan that it starts."),
  end_picture_asset_id: idInput(
    "The end picture of the shot, when the clip will end on it as its last frame (last_frame_asset_id). The critic checks it in the same turn, against the end state and the design.",
  ).optional(),
};

export interface StartTarget {
  plan: StoryPlan;
  shot: Shot;
  job: StartJob;
}

function pictureOf(options: {
  snapshot: ProjectSnapshot;
  assetId: string | undefined;
}): Asset | undefined {
  return options.snapshot.assets.find(
    (asset) => asset.id === options.assetId && asset.kind === "image",
  );
}

export function startTargetOf(options: {
  snapshot: ProjectSnapshot;
  input: {
    asset_id: string;
    shot_id: string;
    end_picture_asset_id?: string | undefined;
  };
}): Outcome<StartTarget, HarnessFailure> {
  const { snapshot, input } = options;
  const plan = snapshot.bible.storyPlan;
  const index = (plan?.shots ?? []).findIndex(
    (shot) => shot.id === input.shot_id,
  );
  const shot = plan?.shots[index];
  const picture = pictureOf({ snapshot, assetId: input.asset_id });
  const endPicture = pictureOf({
    snapshot,
    assetId: input.end_picture_asset_id,
  });
  const endMissing =
    input.end_picture_asset_id !== undefined && endPicture === undefined;
  if (
    plan === undefined ||
    shot === undefined ||
    picture === undefined ||
    endMissing
  ) {
    return {
      ok: false,
      failure: {
        kind: "not-found",
        message: `The plan has no shot "${input.shot_id}", or the project has no picture "${input.asset_id}"${input.end_picture_asset_id === undefined ? "" : ` or "${input.end_picture_asset_id}"`}.`,
        hint: "Give the id of a start picture made with shot_id, and its shot.",
      },
    };
  }
  const members = snapshot.bible.cast.filter((member) =>
    [shot.placeId, ...shot.castIds].includes(member.id),
  );
  const previousEnd = previousEndOf({ snapshot, plan, shotIndex: index });
  const keyPictures = [
    picture,
    ...(endPicture === undefined ? [] : [endPicture]),
  ];
  const sheetIds = new Set(
    members.flatMap((member) => member.referenceAssetIds),
  );
  const design = shotDesignJobOf({
    snapshot,
    castIds: shot.castIds,
    castLooks: shot.castLooks,
    target: { kind: "pictures", pictures: keyPictures },
  });
  const turnarounds = (design?.members ?? []).flatMap((entry) =>
    entry.turnaround === undefined || sheetIds.has(entry.turnaround.id)
      ? []
      : [entry.turnaround],
  );
  return {
    ok: true,
    value: {
      plan,
      shot,
      job: {
        kind: "start",
        picture,
        shot,
        members,
        previousEnd,
        endPicture,
        design,
        openPlanFaults: planNoteLinesOf({ plan, shot, members }),
        pictures: [
          ...keyPictures,
          ...(previousEnd === undefined ? [] : [previousEnd]),
          ...snapshot.assets.filter((asset) => sheetIds.has(asset.id)),
          ...turnarounds,
        ],
        answer: undefined,
      },
    },
  };
}

export function withStartReview(options: {
  shots: Shot[];
  shotId: string;
  review: StartReview;
  checks: DesignCheck[];
}): Shot[] {
  return options.shots.map((shot) =>
    shot.id === options.shotId
      ? withDesignChecks({
          shot: {
            ...shot,
            startReviews: [
              ...(shot.startReviews ?? []).filter(
                (entry) =>
                  entry.assetId !== options.review.assetId ||
                  entry.endPictureAssetId !== options.review.endPictureAssetId,
              ),
              options.review,
            ],
          },
          checks: options.checks,
        })
      : shot,
  );
}
