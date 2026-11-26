import {
  cutItemId,
  storyItemId,
  type Take,
  type TakeNote,
} from "../format/takes.js";

export type AssetVerdict = "approved" | "change" | "question" | "dropped";

const verdictWeights: Record<AssetVerdict, number> = {
  approved: 0,
  question: 1,
  change: 2,
  dropped: 3,
};

export function noteVerdictOf(note: TakeNote): AssetVerdict {
  if (note.dropped === true) return "dropped";
  if (note.question === true) return "question";
  if (note.approved === true) return "approved";
  return "change";
}

export function noteVerdictsOf(
  notes: readonly TakeNote[],
): Map<string, AssetVerdict> {
  const verdicts = new Map<string, AssetVerdict>();
  for (const note of notes) {
    const verdict = noteVerdictOf(note);
    const before = verdicts.get(note.itemId);
    if (
      before === undefined ||
      verdictWeights[verdict] > verdictWeights[before]
    ) {
      verdicts.set(note.itemId, verdict);
    }
  }
  return verdicts;
}

export function unapprovedItemIdsOf(notes: readonly TakeNote[]): Set<string> {
  return new Set(
    [...noteVerdictsOf(notes)]
      .filter(([, verdict]) => verdict !== "approved")
      .map(([itemId]) => itemId),
  );
}

export function openTakeOf(takes: readonly Take[]): Take | undefined {
  return takes.find((take) => take.state === "open");
}

export function sentTakesOf(takes: readonly Take[]): Take[] {
  return takes
    .filter((take) => take.state === "sent")
    .toSorted((...[first, second]) =>
      (first.sentAt ?? "").localeCompare(second.sentAt ?? ""),
    );
}

export function lastSentTakeOf(takes: readonly Take[]): Take | undefined {
  return sentTakesOf(takes).at(-1);
}

export function nextTakeNumberOf(options: {
  takes: readonly Take[];
  chapterId: string | undefined;
}): number {
  return (
    options.takes.filter((take) => take.chapterId === options.chapterId)
      .length + 1
  );
}

function isNoteOnAsset(options: { take: Take; itemId: string }): boolean {
  const item = options.take.items.find(
    (candidate) => candidate.id === options.itemId,
  );
  if (item !== undefined) return item.kind === "asset";
  return options.itemId !== storyItemId && options.itemId !== cutItemId;
}

export interface AssetDecision {
  verdict: AssetVerdict;
  take: Take;
}

export function assetDecisionsOf(
  takes: readonly Take[],
): Map<string, AssetDecision> {
  const decisions = new Map<string, AssetDecision>();
  for (const take of sentTakesOf(takes)) {
    for (const item of take.items) {
      if (item.kind === "asset" && item.approved === true) {
        decisions.set(item.id, { verdict: "approved", take });
      }
    }
    for (const [itemId, verdict] of noteVerdictsOf(take.notes)) {
      if (isNoteOnAsset({ take, itemId })) {
        decisions.set(itemId, { verdict, take });
      }
    }
  }
  return decisions;
}

export function assetVerdictsOf(
  takes: readonly Take[],
): Map<string, AssetVerdict> {
  return new Map(
    [...assetDecisionsOf(takes)].map(([assetId, decision]) => [
      assetId,
      decision.verdict,
    ]),
  );
}

export function isRefusedByPerson(options: {
  takes: readonly Take[];
  assetId: string;
}): boolean {
  const verdict = assetVerdictsOf(options.takes).get(options.assetId);
  return verdict === "change" || verdict === "dropped";
}

export function isAssetApproved(options: {
  takes: readonly Take[];
  assetId: string;
}): boolean {
  return assetVerdictsOf(options.takes).get(options.assetId) === "approved";
}
