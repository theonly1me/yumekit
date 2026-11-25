import {
  castLookOf,
  defaultLookId,
  propText,
  shotLookIdOf,
  type CastMember,
  type Shot,
  type StoryPlan,
} from "@yumekit/project";
import { nearestPoseOf } from "../kitSheets.js";

export function lookBriefOf(options: {
  plan: StoryPlan;
  shot: Shot;
  member: CastMember;
}) {
  const { shot, member } = options;
  if (member.looks === undefined) return { lines: [], data: {} };
  const lookId = shotLookIdOf({ castLooks: shot.castLooks, castId: member.id });
  const look = castLookOf({ member, lookId });
  if (look === undefined) {
    return {
      lines: [
        `  The shot dresses ${member.name} in the look "${lookId}", which the entry does not have.`,
      ],
      data: { look_id: lookId, look: null },
    };
  }
  const nearest = nearestPoseOf({ ...options, member });
  const sheets = look.sheets.filter(
    (sheet) => (sheet.check?.breaks.length ?? 0) === 0,
  );
  const broken = look.sheets.filter((sheet) => !sheets.includes(sheet));
  return {
    lines: [
      `  Look in this shot: "${look.id}" (${look.name})${lookId === defaultLookId ? "" : `, chosen by the person: "${look.personAsked?.words ?? ""}"`}. The base facts above stay in every look.`,
      `  Clothes: ${look.clothes.join("; ") || "none named"}.`,
      `  Props: ${look.props.map(propText).join("; ") || "none"}.`,
      `  Sheets of this look: ${sheets.map((sheet) => `${sheet.kind} "${sheet.assetId}"`).join(", ") || "none yet"}.`,
      ...(broken.length === 0
        ? []
        : [
            `  Do not pass ${broken.map((sheet) => `"${sheet.assetId}"`).join(", ")}: the design check found a break in it.`,
          ]),
      ...(nearest === undefined
        ? []
        : [
            `  Nearest pose to the start of this shot: "${nearest.pose}" on the pose sheet "${nearest.assetId}". Pass it in reference_asset_ids of the start picture, and say which figure to follow.`,
          ]),
    ],
    data: {
      look_id: look.id,
      look: {
        name: look.name,
        clothes: look.clothes,
        props: look.props.map(propText),
        sheets: sheets.map((sheet) => ({
          asset_id: sheet.assetId,
          kind: sheet.kind,
          ...(sheet.poses === undefined ? {} : { poses: sheet.poses }),
        })),
      },
      nearest_pose:
        nearest === undefined
          ? null
          : { asset_id: nearest.assetId, pose: nearest.pose },
    },
  };
}
