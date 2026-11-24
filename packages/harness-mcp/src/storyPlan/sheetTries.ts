import type { CastMember, SheetTry } from "@yumekit/project";

export function sheetTriesOf(member: CastMember): SheetTry[] {
  if (member.sheetTries !== undefined) return member.sheetTries;
  const review = member.sheetReview;
  return review === undefined
    ? []
    : [
        {
          assetIds: review.assetIds,
          verdict: review.verdict,
          faults: review.faults,
          notes: review.notes ?? [],
        },
      ];
}
