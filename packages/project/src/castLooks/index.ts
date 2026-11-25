import type { CastMember } from "../format/bible.js";
import {
  defaultLookId,
  type CastLook,
  type LookProp,
  type LookSheet,
} from "../format/castLooks.js";
export {
  defaultLookId,
  lookLimits,
  lookSheetKinds,
  type CastLook,
  type LookProp,
  type LookSheet,
  type LookSheetKind,
} from "../format/castLooks.js";
export {
  designAnswers,
  designCheckers,
  type DesignAnswer,
  type DesignCheck,
  type DesignChecker,
  type DesignFrame,
} from "../format/designCheck.js";

export interface ResolvedLook {
  id: string;
  name: string;
  clothes: string[];
  props: LookProp[];
  sheets: LookSheet[];
  personAsked: { words: string } | undefined;
  isDefault: boolean;
}

export interface DesignQuestion {
  kind: "base" | "garment" | "prop";
  text: string;
}

type LookOwner = Pick<CastMember, "referenceAssetIds" | "looks">;

function defaultSheetsOf(member: LookOwner): LookSheet[] {
  return member.referenceAssetIds.map((...[assetId, index]) => ({
    assetId,
    kind: index === 0 ? "turnaround" : "hands-props",
  }));
}

function resolved(options: {
  look: CastLook | undefined;
  member: LookOwner;
  lookId: string;
}): ResolvedLook {
  const { look, member, lookId } = options;
  const isDefault = lookId === defaultLookId;
  return {
    id: lookId,
    name: look?.name ?? (isDefault ? "Default" : lookId),
    clothes: look?.clothes ?? [],
    props: look?.props ?? [],
    sheets: [
      ...(isDefault ? defaultSheetsOf(member) : []),
      ...(look?.sheets ?? []),
    ],
    personAsked: look?.personAsked,
    isDefault,
  };
}

export function castLooksOf(member: LookOwner): ResolvedLook[] {
  const looks = member.looks ?? [];
  const hasDefault = looks.some((look) => look.id === defaultLookId);
  return [
    ...(hasDefault
      ? []
      : [resolved({ look: undefined, member, lookId: defaultLookId })]),
    ...looks.map((look) => resolved({ look, member, lookId: look.id })),
  ];
}

export function castLookOf(options: {
  member: LookOwner;
  lookId: string;
}): ResolvedLook | undefined {
  return castLooksOf(options.member).find((look) => look.id === options.lookId);
}

export function hasDesign(member: Pick<CastMember, "kind" | "looks">): boolean {
  return member.kind === "person" && (member.looks ?? []).length > 0;
}

export function propText(prop: LookProp): string {
  const side = prop.side.trim() === "" ? "" : `, ${prop.side.trim()}`;
  return prop.count === 0
    ? `No ${prop.name}${side}`
    : `Exactly ${String(prop.count)} ${prop.name}${side}`;
}

export function designQuestionsOf(options: {
  member: Pick<CastMember, "facts">;
  look: ResolvedLook;
}): DesignQuestion[] {
  return [
    ...(options.member.facts ?? []).map((text) => ({
      kind: "base" as const,
      text,
    })),
    ...options.look.clothes.map((text) => ({ kind: "garment" as const, text })),
    ...options.look.props.map((prop) => ({
      kind: "prop" as const,
      text: propText(prop),
    })),
  ];
}

export function shotLookIdOf(options: {
  castLooks: Record<string, string> | undefined;
  castId: string;
}): string {
  return options.castLooks?.[options.castId] ?? defaultLookId;
}

export function turnaroundOf(look: ResolvedLook): string | undefined {
  return look.sheets.find((sheet) => sheet.kind === "turnaround")?.assetId;
}

export function lookPictureIdsOf(look: ResolvedLook): string[] {
  return look.sheets
    .filter(
      (sheet) => sheet.kind === "turnaround" || sheet.kind === "hands-props",
    )
    .map((sheet) => sheet.assetId);
}

export function castPictureIdsOf(member: LookOwner): string[] {
  return [
    ...new Set([
      ...member.referenceAssetIds,
      ...(member.looks ?? []).flatMap((look) =>
        look.sheets.map((sheet) => sheet.assetId),
      ),
    ]),
  ];
}
