import type { Snapshot } from "../../../engine/snapshot.js";
import { placeUsesOf } from "../filters/inUse.js";
import { toggleUse, withoutUse } from "./itemDrafts.js";
import type { TakeReview } from "./useTakeReview.js";

export interface Picks {
  inUseIds: ReadonlySet<string>;
  canPick: boolean;
  isPicked: (itemId: string) => boolean;
  toggle: (itemId: string) => void;
}

export function picksOf(options: {
  snapshot: Snapshot;
  review: TakeReview;
  reviewIds: readonly string[];
  canMark: boolean;
}): Picks {
  const { review } = options;
  const draftPicks = options.canMark
    ? options.reviewIds.filter((itemId) => review.draftOf(itemId).use === true)
    : [];
  const uses = placeUsesOf({ snapshot: options.snapshot, draftPicks });
  return {
    inUseIds: uses.inUseIds,
    canPick: options.canMark && review.isLoaded,
    isPicked: (itemId) => draftPicks.includes(itemId),
    toggle: (itemId) => {
      const isPicking = review.draftOf(itemId).use !== true;
      review.change({ itemId, next: toggleUse });
      const place = uses.placeKeyOfItem(itemId);
      if (!isPicking || place === undefined) return;
      for (const other of draftPicks) {
        if (other !== itemId && uses.placeKeyOfItem(other) === place) {
          review.change({ itemId: other, next: withoutUse });
        }
      }
    },
  };
}
