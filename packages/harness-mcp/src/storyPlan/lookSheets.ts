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
