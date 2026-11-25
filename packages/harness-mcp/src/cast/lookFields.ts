import {
  defaultLookId,
  type CastLook,
  type CastMember,
  type LookSheet,
  type ProjectSnapshot,
} from "@yumekit/project";
import type { HarnessFailure, Outcome } from "../results.js";
import { sourceIdsOf } from "../storyPlan/tryRules.js";
import type { LookInput } from "./lookInput.js";

export interface LookFields {
  looks: CastLook[] | undefined;
  referenceAssetIds: string[];
}

type LookSheetInput = NonNullable<LookInput["sheets"]>[number];

function isClassic(sheet: { kind: string }): boolean {
  return sheet.kind === "turnaround" || sheet.kind === "hands-props";
}

function sheetOf(options: {
  snapshot: ProjectSnapshot;
  sheet: LookSheetInput;
  kept: LookSheet | undefined;
}): LookSheet {
  const { snapshot, sheet, kept } = options;
  const asset = snapshot.assets.find((entry) => entry.id === sheet.asset_id);
  const poses =
    sheet.poses ??
    (sheet.kind === "poses"
      ? sourceIdsOf({ asset, field: "poses" })
      : undefined);
  return {
    assetId: sheet.asset_id,
    kind: sheet.kind,
    ...(poses === undefined || poses.length === 0 ? {} : { poses }),
    ...(kept?.check === undefined ? {} : { check: kept.check }),
  };
}

function storedLookOf(options: {
  snapshot: ProjectSnapshot;
  input: LookInput;
  existing: CastLook | undefined;
}): CastLook {
  const { snapshot, input, existing } = options;
  const isDefault = input.look_id === defaultLookId;
  const given = input.sheets?.map((sheet) =>
    sheetOf({
      snapshot,
      sheet,
      kept: existing?.sheets.find((entry) => entry.assetId === sheet.asset_id),
    }),
  );
  const sheets = (given ?? existing?.sheets ?? []).filter(
    (sheet) => !isDefault || !isClassic(sheet),
  );
  const sameDesign =
    JSON.stringify([existing?.clothes, existing?.props]) ===
    JSON.stringify([input.clothes, input.props]);
  const sameSheets =
    JSON.stringify(existing?.sheets.filter(isClassic)) ===
    JSON.stringify(sheets.filter(isClassic));
  const words = input.person_asked_for_it ?? existing?.personAsked?.words;
  return {
    id: input.look_id,
    name: input.name,
    clothes: input.clothes,
    props: input.props,
    sheets,
    ...(words === undefined ? {} : { personAsked: { words } }),
    ...(existing?.sheetReview !== undefined && sameDesign && sameSheets
      ? { sheetReview: existing.sheetReview }
      : {}),
  };
}

function missingPictureOf(options: {
  snapshot: ProjectSnapshot;
  looks: LookInput[];
}): HarnessFailure | undefined {
  const missing = options.looks
    .flatMap((look) => look.sheets ?? [])
    .filter(
      (sheet) =>
        !options.snapshot.assets.some(
          (asset) => asset.id === sheet.asset_id && asset.kind === "image",
        ),
    );
  if (missing.length === 0) return undefined;
  return {
    kind: "asset-not-found",
    message: `The project has no picture ${missing.map((sheet) => `"${sheet.asset_id}"`).join(", ")}.`,
    hint: "Give the id of an image asset for each sheet.",
  };
}

function unaskedLookOf(options: {
  existing: CastMember | undefined;
  looks: LookInput[];
}): HarnessFailure | undefined {
  const known = new Set((options.existing?.looks ?? []).map((look) => look.id));
  const unasked = options.looks.filter(
    (look) =>
      look.look_id !== defaultLookId &&
      !known.has(look.look_id) &&
      look.person_asked_for_it === undefined,
  );
  if (unasked.length === 0) return undefined;
  return {
    kind: "look-needs-person",
    message: `A new look (${unasked.map((look) => `"${look.look_id}"`).join(", ")}) changes how the person looks in the film. That is the decision of the person.`,
    hint: "If the request already describes this change of clothes, give its words in person_asked_for_it. Otherwise propose the look to the person, ask, and give their answer in person_asked_for_it.",
  };
}

export function withLooks(options: {
  member: CastMember;
  looks: CastLook[] | undefined;
}): CastMember {
  const { member, looks } = options;
  return looks === undefined ? member : { ...member, looks };
}

export function noLookWarningOf(member: CastMember): { text: string }[] {
  if (member.kind !== "person" || (member.looks ?? []).length > 0) return [];
  return [
    {
      text: `"${member.id}" has no look, so the design check cannot hold its clothes and props in each picture and clip. Give looks with the look "${defaultLookId}": each garment with its construction, and each prop with its count and side.`,
    },
  ];
}

export function lookFieldsOf(options: {
  snapshot: ProjectSnapshot;
  existing: CastMember | undefined;
  input: {
    looks?: LookInput[] | undefined;
    reference_asset_ids?: string[] | undefined;
  };
}): Outcome<LookFields, HarnessFailure> {
  const { snapshot, existing } = options;
  const { looks } = options.input;
  const fallback =
    options.input.reference_asset_ids ?? existing?.referenceAssetIds ?? [];
  if (looks === undefined) {
    return {
      ok: true,
      value: { looks: existing?.looks, referenceAssetIds: fallback },
    };
  }
  const ids = looks.map((look) => look.look_id);
  const failure =
    (new Set(ids).size === ids.length
      ? undefined
      : {
          kind: "invalid-value",
          message: "Each look id must be unique in one entry.",
          hint: "Give each look once.",
        }) ??
    missingPictureOf({ snapshot, looks }) ??
    unaskedLookOf({ existing, looks });
  if (failure !== undefined) return { ok: false, failure };
  const classic = (
    looks.find((look) => look.look_id === defaultLookId)?.sheets ?? []
  )
    .filter(isClassic)
    .sort((...[first, second]) =>
      first.kind === second.kind ? 0 : first.kind === "turnaround" ? -1 : 1,
    )
    .map((sheet) => sheet.asset_id);
  return {
    ok: true,
    value: {
      looks: looks.map((input) =>
        storedLookOf({
          snapshot,
          input,
          existing: existing?.looks?.find((look) => look.id === input.look_id),
        }),
      ),
      referenceAssetIds: classic.length === 0 ? fallback : classic,
    },
  };
}
