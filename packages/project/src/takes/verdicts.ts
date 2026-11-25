import { cutItemId, storyItemId, type Take } from "../format/takes.js";

export type AssetVerdict = "approved" | "change" | "dropped";

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

export function assetVerdictsOf(
  takes: readonly Take[],
): Map<string, AssetVerdict> {
  const verdicts = new Map<string, AssetVerdict>();
  for (const take of sentTakesOf(takes)) {
    for (const item of take.items) {
      if (item.kind === "asset" && item.approved === true) {
        verdicts.set(item.id, "approved");
      }
    }
    for (const note of take.notes) {
      if (isNoteOnAsset({ take, itemId: note.itemId })) {
        verdicts.set(note.itemId, note.dropped === true ? "dropped" : "change");
      }
    }
  }
  return verdicts;
}

export function isAssetApproved(options: {
  takes: readonly Take[];
  assetId: string;
}): boolean {
  return assetVerdictsOf(options.takes).get(options.assetId) === "approved";
}
