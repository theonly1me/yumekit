import type { ProjectSnapshot, Shot } from "@yumekit/project";
import type { HarnessFailure } from "../results.js";

function lackOf(options: {
  snapshot: ProjectSnapshot;
  castId: string;
}): string | undefined {
  const member = options.snapshot.bible.cast.find(
    (candidate) => candidate.id === options.castId,
  );
  if (member === undefined) return `"${options.castId}" is not in the cast`;
  const lacks = [
    ...((member.facts ?? []).length === 0 ? ["fixed facts"] : []),
    ...(member.referenceAssetIds.length === 0 ? ["a sheet picture"] : []),
  ];
  return lacks.length === 0
    ? undefined
    : `"${member.id}" has no ${lacks.join(" and no ")}`;
}

export function sheetFailureOf(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
}): HarnessFailure | undefined {
  const { shot } = options;
  const lacks = [shot.placeId, ...shot.castIds].flatMap((castId) => {
    const lack = lackOf({ snapshot: options.snapshot, castId });
    return lack === undefined ? [] : [lack];
  });
  if (lacks.length === 0) return undefined;
  return {
    kind: "cast-sheet-missing",
    message: `Shot "${shot.id}" needs a sheet for its place and each person and prop: ${lacks.join("; ")}.`,
    hint: "Make each sheet picture with generate_asset and no shot_id, then give it and the facts to put_cast_member (facts: hair, each garment and color, which hand holds what, five fingers on each hand; for a place, where the door is, its hinge and knob side, the window and the light). Then call again.",
  };
}
