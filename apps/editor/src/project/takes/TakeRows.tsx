import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import type { FullSizeView } from "./large/FullSize.js";
import { pickVerdict, type ItemDraft } from "./review/itemDrafts.js";
import type { Picks } from "./review/picks.js";
import type { TakeReview } from "./review/useTakeReview.js";
import { ReviewRow } from "./rows/ReviewRow.js";
import { sectionNames, type ShownItem } from "./shownItems.js";

export function TakeRows(props: {
  client: EngineClient;
  snapshot: Snapshot;
  takeId: string;
  items: readonly ShownItem[];
  review: TakeReview;
  canMark: boolean;
  draftOf: (itemId: string) => ItemDraft;
  picks: Picks;
  onOpen: (view: FullSizeView) => void;
}) {
  const { review } = props;
  const sections = [...new Set(props.items.map((shown) => shown.section))];
  return sections.map((section) => (
    <section
      key={section}
      className="review-section"
      aria-label={sectionNames[section]}
    >
      <h3>{sectionNames[section]}</h3>
      {props.items
        .filter((shown) => shown.section === section)
        .map((shown) => {
          const itemId = shown.item.id;
          return (
            <ReviewRow
              key={itemId}
              client={props.client}
              snapshot={props.snapshot}
              shown={shown}
              takeId={props.takeId}
              state={{
                draft: props.draftOf(itemId),
                save: review.saveOf(itemId),
                canMark: props.canMark,
                isLoaded: !props.canMark || review.isLoaded,
                isInUse: props.picks.inUseIds.has(itemId),
              }}
              onChange={(next) => {
                review.change({ itemId, next });
              }}
              onSaveAgain={() => {
                review.saveAgain(itemId);
              }}
              onOpen={props.onOpen}
              onVerdict={(verdict) => {
                if (verdict === "approved" && shown.item.kind === "asset") {
                  props.picks.lookRight(itemId);
                } else {
                  review.change({ itemId, next: pickVerdict(verdict) });
                }
              }}
            />
          );
        })}
    </section>
  ));
}
