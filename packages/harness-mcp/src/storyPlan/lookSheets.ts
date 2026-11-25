import {
  defaultLookId,
  castLookOf,
  lookPictureIdsOf,
  shotLookIdOf,
  turnaroundOf,
  type CastMember,
  type ProjectSnapshot,
  type ResolvedLook,
  type Shot,
} from "@yumekit/project";
import type { HarnessFailure } from "../results.js";

interface DressedMember {
  member: CastMember;
  lookId: string;
  look: ResolvedLook | undefined;
}

function dressedOf(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
}): DressedMember[] {
  const { shot } = options;
  return options.snapshot.bible.cast.flatMap((member) => {
    if (!shot.castIds.includes(member.id)) return [];
    const lookId = shotLookIdOf({
      castLooks: shot.castLooks,
      castId: member.id,
    });
    if (lookId === defaultLookId) return [];
    return [{ member, lookId, look: castLookOf({ member, lookId }) }];
  });
}

export function lookLacksOf(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
}): string[] {
  return dressedOf(options).flatMap(({ member, lookId, look }) => {
    if (look === undefined) {
      return [`"${member.id}" has no look "${lookId}"`];
    }
    return turnaroundOf(look) === undefined
      ? [`"${member.id}" has no turnaround sheet of the look "${lookId}"`]
      : [];
  });
}

function isReviewedNow(options: {
  member: CastMember;
  look: ResolvedLook;
}): boolean {
  const review = options.member.looks?.find(
    (entry) => entry.id === options.look.id,
  )?.sheetReview;
  const pictures = lookPictureIdsOf(options.look);
  const reviewed = review?.assetIds ?? [];
  const isCurrent =
    reviewed.length === pictures.length &&
    pictures.every((id) => reviewed.includes(id));
  return (
    isCurrent &&
    (review?.verdict === "pass" ||
      (options.member.restrictions ?? []).length > 0)
  );
}

export function lookReviewFailureOf(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
}): HarnessFailure | undefined {
  const waiting = dressedOf(options).flatMap(({ member, look }) =>
    look === undefined || isReviewedNow({ member, look })
      ? []
      : [{ castId: member.id, lookId: look.id }],
  );
  if (waiting.length === 0) return undefined;
  return {
    kind: "sheet-not-reviewed",
    message: `The critic has not passed the sheets of ${waiting.map((entry) => `the look "${entry.lookId}" of "${entry.castId}"`).join(", ")} on their current pictures.`,
    hint: `Call review_sheet with ${waiting.map((entry) => `cast_id "${entry.castId}" and look_id "${entry.lookId}"`).join(", and ")}.`,
  };
}

export function shotLookPictureIdsOf(options: {
  snapshot: ProjectSnapshot;
  shotId: string | undefined;
  member: CastMember;
}): string[] {
  const { member } = options;
  const shot = options.snapshot.bible.storyPlan?.shots.find(
    (candidate) => candidate.id === options.shotId,
  );
  const lookId = shotLookIdOf({
    castLooks: shot?.castLooks,
    castId: member.id,
  });
  const look = castLookOf({ member, lookId });
  return look === undefined || lookId === defaultLookId
    ? member.referenceAssetIds
    : lookPictureIdsOf(look);
}
