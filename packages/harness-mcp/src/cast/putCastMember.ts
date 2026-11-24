import {
  type Bible,
  type CastMember,
  type ProjectSnapshot,
} from "@yumekit/project";
import { sheetTriesOf } from "../storyPlan/sheetTries.js";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { planFindingsOf } from "../critic/plan/planFindings.js";
import { referencePathsInput } from "../media/referencePaths.js";
import { failureResult, type HarnessFailure } from "../results.js";
import { sourceTextOf } from "../storyPlan/tryRules.js";
import { wireCastMemberOf } from "./castMembers.js";
import { putCastMemberInput } from "./putCastMemberInput.js";

function bibleWithMember(options: { bible: Bible; member: CastMember }): Bible {
  const { bible, member } = options;
  const exists = bible.cast.some((candidate) => candidate.id === member.id);
  return {
    ...bible,
    cast: exists
      ? bible.cast.map((candidate) =>
          candidate.id === member.id ? member : candidate,
        )
      : [...bible.cast, member],
  };
}

function dodgedTryOf(options: {
  snapshot: ProjectSnapshot;
  existing: CastMember | undefined;
  referenceAssetIds: string[];
}): HarnessFailure | undefined {
  const { snapshot, existing } = options;
  if (existing === undefined) return undefined;
  const tries = sheetTriesOf(existing);
  if (!tries.some((entry) => entry.verdict === "fail")) return undefined;
  const known = new Set([
    ...existing.referenceAssetIds,
    ...tries.flatMap((entry) => entry.assetIds),
  ]);
  const dodged = options.referenceAssetIds.filter((id) => {
    const asset = snapshot.assets.find((candidate) => candidate.id === id);
    return (
      !known.has(id) &&
      asset?.source.kind === "tool" &&
      sourceTextOf({ asset, field: "sheet_of" }) !== existing.id
    );
  });
  if (dodged.length === 0) return undefined;
  return {
    kind: "sheet-try-not-counted",
    message: `The critic refused a sheet of "${existing.id}" before, and ${dodged.join(", ")} was not made as a try of this sheet.`,
    hint: `Make the next try with generate_asset and sheet_of "${existing.id}", so the rule of tries applies.`,
  };
}

function briefChangeOf(options: {
  existing: CastMember | undefined;
  briefFacts: string[] | undefined;
  personAsked: boolean;
}): HarnessFailure | undefined {
  const kept = options.existing?.briefFacts ?? [];
  const next = options.briefFacts ?? kept;
  const dropped = kept.filter((fact) => !next.includes(fact));
  if (dropped.length === 0 || options.personAsked) return undefined;
  return {
    kind: "brief-fact-protected",
    message: `These facts come from the person's brief and stay: ${dropped.map((fact) => `"${fact}"`).join(", ")}.`,
    hint: "Keep them, and plan around them. To change one, ask the person; give person_asked_to_change_brief true only when the person asked for it in this request.",
  };
}

function memberOf(options: {
  input: {
    cast_id: string;
    kind: CastMember["kind"];
    name: string;
    description: string;
  };
  existing: CastMember | undefined;
  facts: string[] | undefined;
  referenceAssetIds: string[];
  sheetPrompts: string[] | undefined;
  restrictions: string[] | undefined;
  briefFacts: string[] | undefined;
}): CastMember {
  const { input, existing, facts, referenceAssetIds } = options;
  const keepsReview =
    existing?.sheetReview !== undefined &&
    JSON.stringify(existing.facts) === JSON.stringify(facts) &&
    JSON.stringify(existing.referenceAssetIds) ===
      JSON.stringify(referenceAssetIds);
  return {
    id: input.cast_id,
    kind: input.kind,
    name: input.name,
    description: input.description.trim(),
    ...(facts === undefined ? {} : { facts }),
    referenceAssetIds,
    ...(keepsReview && existing.sheetReview !== undefined
      ? { sheetReview: existing.sheetReview }
      : {}),
    ...(existing?.sheetTries === undefined
      ? {}
      : { sheetTries: existing.sheetTries }),
    ...(options.sheetPrompts === undefined
      ? {}
      : { sheetPrompts: options.sheetPrompts }),
    ...(options.restrictions === undefined || options.restrictions.length === 0
      ? {}
      : { restrictions: options.restrictions }),
    ...(options.briefFacts === undefined || options.briefFacts.length === 0
      ? {}
      : { briefFacts: options.briefFacts }),
  };
}

export function registerPutCastMember(context: HarnessContext): void {
  context.tools.add({
    name: "put_cast_member",
    description:
      "Add or replace one person, place, product, or prop of the cast. The cast keeps it the same in each picture and each video clip: give its id in cast_ids of generate_asset for each one that shows it. For a film, each entry is a sheet: the facts in words, the prompt of each sheet picture (checked by review_plan before any money), and the pictures (a person: front, side, back, and the face close up, then the hands with the prop; a place: a wide establishing picture; a prop: two sides). The result lists each fact that is a bare number and each part that a person's description lacks.",
    inputSchema: putCastMemberInput,
    run: ({ input }) => {
      const snapshot = context.store.read();
      const existing = snapshot.bible.cast.find(
        (candidate) => candidate.id === input.cast_id,
      );
      const referenceAssetIds =
        input.reference_asset_ids ?? existing?.referenceAssetIds ?? [];
      const pictures = referencePathsInput({
        snapshot,
        projectFolder: context.store.folder,
        ids: { referenceAssetIds, firstFrameAssetId: undefined },
      });
      if (!pictures.ok) return failureResult(pictures.failure);
      const dodged = dodgedTryOf({ snapshot, existing, referenceAssetIds });
      if (dodged !== undefined) return failureResult(dodged);
      const briefFacts = input.brief_facts ?? existing?.briefFacts;
      const briefChange = briefChangeOf({
        existing,
        briefFacts,
        personAsked: input.person_asked_to_change_brief === true,
      });
      if (briefChange !== undefined) return failureResult(briefChange);
      const member = memberOf({
        input,
        existing,
        facts: input.facts ?? existing?.facts,
        referenceAssetIds,
        sheetPrompts: input.sheet_prompts ?? existing?.sheetPrompts,
        restrictions: input.restrictions ?? existing?.restrictions,
        briefFacts,
      });
      const warnings =
        snapshot.bible.storyPlan === undefined
          ? []
          : planFindingsOf([member]).map((finding) => finding.text);
      return applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "setBible",
            bible: bibleWithMember({ bible: snapshot.bible, member }),
          },
        ],
        line: [
          `Cast entry "${input.cast_id}" saved with ${String(referenceAssetIds.length)} pictures and ${String(member.facts?.length ?? 0)} facts.`,
          ...warnings,
        ].join(" "),
        data: { cast_member: wireCastMemberOf(member), warnings },
      });
    },
  });
}
