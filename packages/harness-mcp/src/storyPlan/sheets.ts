import type { CastMember, ProjectSnapshot, Shot } from "@yumekit/project";
import { heldPropsOf } from "../critic/sheet/registerReviewSheet.js";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure } from "../results.js";
import { lookLacksOf, lookReviewFailureOf } from "./lookSheets.js";

function lackOf(options: {
  snapshot: ProjectSnapshot;
  castId: string;
}): string | undefined {
  const { snapshot } = options;
  const member = snapshot.bible.cast.find(
    (candidate) => candidate.id === options.castId,
  );
  if (member === undefined) return `"${options.castId}" is not in the cast`;
  const holds =
    member.kind === "person"
      ? heldPropsOf({ plan: snapshot.bible.storyPlan, personId: member.id })
      : [];
  const lacks = [
    ...((member.facts ?? []).length === 0 ? ["fixed facts"] : []),
    ...(member.referenceAssetIds.length === 0 ? ["sheet picture"] : []),
    ...(holds.length > 0 && member.referenceAssetIds.length < 2
      ? [`picture of the hands holding ${holds.join(", ")}`]
      : []),
  ];
  return lacks.length === 0
    ? undefined
    : `"${member.id}" has no ${lacks.join(" and no ")}`;
}

function isReviewedNow(member: CastMember): boolean {
  const reviewed = member.sheetReview?.assetIds ?? [];
  return (
    reviewed.length === member.referenceAssetIds.length &&
    member.referenceAssetIds.every((id) => reviewed.includes(id))
  );
}

function reviewFailureOf(members: CastMember[]): HarnessFailure | undefined {
  const notReviewed = members.filter((member) => !isReviewedNow(member));
  if (notReviewed.length > 0) {
    const ids = notReviewed.map((member) => member.id);
    return {
      kind: "sheet-not-reviewed",
      message: `The critic has not checked the sheet of ${ids.join(", ")} on its current pictures.`,
      hint: `Call review_sheet for ${ids.map((id) => `"${id}"`).join(", ")} first.`,
    };
  }
  const failed = members.filter(
    (member) =>
      member.sheetReview?.verdict === "fail" &&
      (member.restrictions ?? []).length === 0,
  );
  if (failed.length === 0) return undefined;
  return {
    kind: "sheet-failed-review",
    message: `The critic failed the sheet of ${failed.map((member) => `${member.id} (${(member.sheetReview?.faults ?? []).join("; ")})`).join(", ")}.`,
    hint: "Make the next try of the sheet with generate_asset and sheet_of (the rules of tries apply), give it to put_cast_member, and call review_sheet again. Or use the best version with restrictions on its cast entry, then call review_plan again.",
  };
}

export function sheetFailureOf(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
}): HarnessFailure | undefined {
  const { shot, snapshot } = options;
  const ids = [shot.placeId, ...shot.castIds];
  const lacks = [
    ...ids.flatMap((castId) => {
      const lack = lackOf({ snapshot, castId });
      return lack === undefined ? [] : [lack];
    }),
    ...lookLacksOf({ snapshot, shot }),
  ];
  if (lacks.length > 0) {
    return {
      kind: "cast-sheet-missing",
      message: `Shot "${shot.id}" needs a sheet for its place and each person and prop: ${lacks.join("; ")}.`,
      hint: "Make each sheet picture with generate_asset and no shot_id, then give it and the facts to put_cast_member (facts: hair, each garment and color, height against the hero, which hand holds what, five fingers on each hand; for a place, where the door is, its hinge and knob side, the window and the light). A person who holds a prop needs a second picture of the hands with the prop. Then call again.",
    };
  }
  return (
    reviewFailureOf(
      snapshot.bible.cast.filter((member) => ids.includes(member.id)),
    ) ?? lookReviewFailureOf({ snapshot, shot })
  );
}

export function isFreeSheet(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): boolean {
  const { request } = options;
  if (request.sheet_of === undefined || request.shot_id !== undefined) {
    return false;
  }
  const member = options.snapshot.bible.cast.find(
    (candidate) => candidate.id === request.sheet_of,
  );
  return (
    (member?.facts ?? []).length > 0 && (member?.sheetPrompts ?? []).length > 0
  );
}
