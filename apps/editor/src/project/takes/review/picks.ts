import type { Snapshot } from "../../../engine/snapshot.js";
import { placeUsesOf } from "../filters/inUse.js";
import { pickVerdict, useThisVersion, withoutUse } from "./itemDrafts.js";
import type { TakeReview } from "./useTakeReview.js";

export interface Picks {
  inUseIds: ReadonlySet<string>;
  canPick: boolean;
  lookRight: (itemId: string) => void;
}

export function picksOf(options: {
  snapshot: Snapshot;
  review: TakeReview;
  ownIds: readonly string[];
  reviewIds: readonly string[];
  canMark: boolean;
}): Picks {
  const { review, canMark } = options;
  const draftPicks = canMark
    ? options.reviewIds.filter((itemId) => review.draftOf(itemId).use === true)
    : [];
  const draftDefaults = canMark
    ? options.ownIds.filter(
        (itemId) => review.draftOf(itemId).verdict === undefined,
      )
    : [];
  const uses = placeUsesOf({
    snapshot: options.snapshot,
    draftDefaults,
    draftPicks,
  });
  return {
    inUseIds: uses.inUseIds,
    canPick: canMark && review.isLoaded,
    lookRight: (itemId) => {
      const draft = review.draftOf(itemId);
      if (draft.verdict === "approved" && draft.use === true) {
        review.change({ itemId, next: pickVerdict("approved") });
        return;
      }
      review.change({ itemId, next: useThisVersion });
      const place = uses.placeKeyOfItem(itemId);
      if (place === undefined) return;
      for (const other of draftPicks) {
        if (other !== itemId && uses.placeKeyOfItem(other) === place) {
          review.change({ itemId: other, next: withoutUse });
        }
      }
    },
  };
}
