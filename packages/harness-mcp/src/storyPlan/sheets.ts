import type { ProjectSnapshot, Shot } from "@yumekit/project";
import { heldPropsOf } from "../critic/sheet/registerReviewSheet.js";
import type { HarnessFailure } from "../results.js";
import { lookLacksOf } from "./lookSheets.js";

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

export function sheetLacksOf(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
}): string[] {
  const { shot, snapshot } = options;
  return [
    ...[shot.placeId, ...shot.castIds].flatMap((castId) => {
      const lack = lackOf({ snapshot, castId });
      return lack === undefined ? [] : [lack];
    }),
    ...lookLacksOf({ snapshot, shot }),
  ];
}

export function sheetFailureOf(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
}): HarnessFailure | undefined {
  const lacks = sheetLacksOf(options);
  if (lacks.length === 0) return undefined;
  return {
    kind: "cast-sheet-missing",
    message: `Shot "${options.shot.id}" needs a sheet for its place and each person and prop: ${lacks.join("; ")}.`,
    hint: "Make each sheet picture with generate_asset and sheet_of (all sheets of the film in one generate_assets call), then give it and the facts to put_cast_member (facts: hair, each garment and color, height against the hero, which hand holds what, five fingers on each hand; for a place, where the door is, its hinge and knob side, the window and the light). A person who holds a prop needs a second picture of the hands with the prop. Then call again.",
  };
}
