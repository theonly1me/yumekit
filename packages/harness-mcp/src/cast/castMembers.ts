import type { CastMember, ProjectSnapshot } from "@yumekit/project";
import type { HarnessFailure, Outcome } from "../results.js";

export function wireCastMemberOf(member: CastMember) {
  return {
    id: member.id,
    kind: member.kind,
    name: member.name,
    description: member.description,
    facts: member.facts ?? [],
    reference_asset_ids: member.referenceAssetIds,
    sheet_prompts: member.sheetPrompts ?? [],
    restrictions: member.restrictions ?? [],
  };
}

export function castMemberNotFound(options: {
  snapshot: ProjectSnapshot;
  castId: string;
}): HarnessFailure {
  const ids = options.snapshot.bible.cast.map((member) => member.id);
  return {
    kind: "cast-member-not-found",
    message: `The cast has no entry "${options.castId}".`,
    hint: `Use one of these cast ids: ${ids.length === 0 ? "none" : ids.join(", ")}. Or add the entry with put_cast_member.`,
  };
}

export function findCastMembers(options: {
  snapshot: ProjectSnapshot;
  castIds: string[];
}): Outcome<CastMember[], HarnessFailure> {
  const { snapshot } = options;
  const members: CastMember[] = [];
  for (const castId of options.castIds) {
    const member = snapshot.bible.cast.find(
      (candidate) => candidate.id === castId,
    );
    if (member === undefined) {
      return { ok: false, failure: castMemberNotFound({ snapshot, castId }) };
    }
    members.push(member);
  }
  return { ok: true, value: members };
}
