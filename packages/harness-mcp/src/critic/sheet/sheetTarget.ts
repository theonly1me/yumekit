import {
  castLookOf,
  defaultLookId,
  lookPictureIdsOf,
  propText,
  type Bible,
  type CastMember,
  type DesignCheck,
  type ProjectSnapshot,
  type SheetReview,
} from "@yumekit/project";
import type { HarnessFailure, Outcome } from "../../results.js";
import { designMemberOf } from "../design/designJob.js";
import type { SheetJob } from "./sheetJob.js";

export interface SheetTarget {
  member: CastMember;
  lookId: string;
  classicIds: string[];
  job: SheetJob;
}

function lookLinesOf(options: {
  member: CastMember;
  lookId: string;
  kitIds: string[];
}): string[] {
  const look = castLookOf(options);
  if (look === undefined || options.member.looks === undefined) return [];
  return [
    `The look "${look.id}" (${look.name}). Its clothes: ${look.clothes.join("; ") || "none named"}. Its props: ${look.props.map(propText).join("; ") || "none"}.`,
    ...(options.kitIds.length === 0
      ? []
      : [
          `The kit sheets ${options.kitIds.join(", ")} (expressions and poses) are judged only by the design check below, against the turnaround. The verdict covers the other pictures.`,
        ]),
  ];
}

export function sheetTargetOf(options: {
  snapshot: ProjectSnapshot;
  castId: string;
  lookId: string | undefined;
  holds: string[];
}): Outcome<SheetTarget, HarnessFailure> {
  const { snapshot } = options;
  const lookId = options.lookId ?? defaultLookId;
  const member = snapshot.bible.cast.find(
    (candidate) => candidate.id === options.castId,
  );
  const look =
    member === undefined ? undefined : castLookOf({ member, lookId });
  if (member === undefined || look === undefined) {
    return {
      ok: false,
      failure: {
        kind: "cast-not-found",
        message: `The cast has no entry "${options.castId}"${member === undefined ? "" : ` with the look "${lookId}"`}.`,
        hint: `Use one of: ${snapshot.bible.cast.map((candidate) => candidate.id).join(", ") || "none"}.`,
      },
    };
  }
  const classicIds =
    lookId === defaultLookId
      ? member.referenceAssetIds
      : lookPictureIdsOf(look);
  const kitIds = look.sheets
    .filter((sheet) => sheet.kind === "expressions" || sheet.kind === "poses")
    .map((sheet) => sheet.assetId);
  const pictureOf = (id: string) =>
    snapshot.assets.find(
      (asset) =>
        asset.id === id && (asset.kind === "image" || asset.kind === "video"),
    );
  const pictures = classicIds.flatMap((id) => pictureOf(id) ?? []);
  if (pictures.length === 0) {
    return {
      ok: false,
      failure: {
        kind: "cast-sheet-missing",
        message: `"${member.id}" has no sheet picture to check${lookId === defaultLookId ? "" : ` for the look "${lookId}"`}.`,
        hint: "Make the sheet picture and give it to put_cast_member first.",
      },
    };
  }
  const kits = kitIds.flatMap((id) => pictureOf(id) ?? []);
  const designed = designMemberOf({ snapshot, member, lookId });
  return {
    ok: true,
    value: {
      member,
      lookId,
      classicIds,
      job: {
        kind: "sheet",
        member,
        pictures: [...pictures, ...kits],
        holds: options.holds,
        lookLines: lookLinesOf({ member, lookId, kitIds }),
        design:
          designed === undefined || kits.length === 0
            ? undefined
            : {
                members: [designed],
                target: { kind: "pictures", pictures: kits },
                seen: [],
              },
        answer: undefined,
      },
    },
  };
}

export function memberWithLookReview(options: {
  member: CastMember;
  lookId: string;
  review: SheetReview;
  checks: DesignCheck[];
}): CastMember {
  const { member, lookId, review, checks } = options;
  if (member.looks === undefined) return member;
  return {
    ...member,
    looks: member.looks.map((look) =>
      look.id !== lookId
        ? look
        : {
            ...look,
            ...(lookId === defaultLookId ? {} : { sheetReview: review }),
            sheets: look.sheets.map((sheet) => {
              const check = checks.find(
                (candidate) => candidate.assetId === sheet.assetId,
              );
              return check === undefined ? sheet : { ...sheet, check };
            }),
          },
    ),
  };
}

export function bibleWithMember(options: {
  bible: Bible;
  member: CastMember;
}): Bible {
  return {
    ...options.bible,
    cast: options.bible.cast.map((candidate) =>
      candidate.id === options.member.id ? options.member : candidate,
    ),
  };
}
