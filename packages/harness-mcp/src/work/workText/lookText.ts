import {
  castLooksOf,
  hasDesign,
  propText,
  type CastMember,
  type ProjectSnapshot,
  type Shot,
} from "@yumekit/project";
import { poseProposalsOf } from "../../storyPlan/kitSheets.js";

export function castLookLines(member: CastMember): string[] {
  if (member.looks === undefined) return [];
  return castLooksOf(member).map(
    (look) =>
      `  Look "${look.id}" (${look.name})${look.personAsked === undefined ? "" : `, asked by the person: "${look.personAsked.words}"`}. Clothes: ${look.clothes.join("; ") || "none"}. Props: ${look.props.map(propText).join("; ") || "none"}. Sheets: ${look.sheets.map((sheet) => `${sheet.kind} ${sheet.assetId}${(sheet.check?.breaks.length ?? 0) > 0 ? " (breaks the design)" : ""}`).join(", ") || "none"}.`,
  );
}

export function poseSheetLines(snapshot: ProjectSnapshot): string[] {
  const plan = snapshot.bible.storyPlan;
  const lines = snapshot.bible.cast.filter(hasDesign).flatMap((member) =>
    castLooksOf(member).flatMap((look) => {
      const poses = poseProposalsOf({
        plan,
        castId: member.id,
        lookId: look.id,
      });
      return poses.length === 0
        ? []
        : [
            `- ${member.id}, look "${look.id}": ${poses.map((proposal) => `"${proposal.pose}"`).join(", ")}`,
          ];
    }),
  );
  return lines.length === 0
    ? []
    : [
        "Poses for the pose sheets (a help, not a gate: generate_asset with sheet_of, look_id, and sheet_kind poses records these poses; then add the sheet to the look with put_cast_member):",
        ...lines,
      ];
}

export function shotDesignLines(shot: Shot): string[] {
  const looks = Object.entries(shot.castLooks ?? {})
    .map(([castId, lookId]) => `${castId} in "${lookId}"`)
    .join(", ");
  const checks = (shot.designChecks ?? []).map((check) => {
    const state =
      check.breaks.length === 0
        ? "the same design"
        : check.cleanUntilSeconds === undefined
          ? `a break: ${check.breaks.join("; ")}`
          : `clean until ${String(check.cleanUntilSeconds)}s, then ${check.breaks.join("; ")}`;
    const person =
      check.personKept === undefined
        ? ""
        : ` The person chose it: "${check.personKept.words}".`;
    return `${check.assetId} (by the ${check.by}): ${state}.${person}`;
  });
  return [
    ...(looks === "" ? [] : [`   Looks: ${looks}`]),
    ...(checks.length === 0 ? [] : [`   Design check: ${checks.join(" ")}`]),
  ];
}
