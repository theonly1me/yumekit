import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { TakeFilters } from "./filters/TakeFilters.js";
import { useTakeFilter } from "./filters/useTakeFilter.js";
import { FullSize, type FullSizeView } from "./large/FullSize.js";
import { isReadOnlyTake, newerTakeOf } from "./newerTake.js";
import { OlderTakeLine } from "./OlderTakeLine.js";
import { verdictOfDraft } from "./review/itemDrafts.js";
import { picksOf } from "./review/picks.js";
import { sentDraftOf } from "./review/sentDraft.js";
import type { TakeReview } from "./review/useTakeReview.js";
import { reviewItemIdsOf, shownItemsOf } from "./shownItems.js";
import { TakeRows } from "./TakeRows.js";
import { TakeSlate, type SlateProgress } from "./TakeSlate.js";
import type { Chapter, Take } from "./takeTypes.js";
import "./media/media.css";
import "./takeView.css";

export function TakeView(props: {
  client: EngineClient;
  snapshot: Snapshot;
  take: Take;
  chapters: Chapter[];
  review: TakeReview;
  progress: SlateProgress | undefined;
  onPickTake: (takeId: string) => void;
}) {
  const { snapshot, take, review } = props;
  const [view, setView] = useState<FullSizeView>();
  const items = shownItemsOf({ snapshot, take, withEarlier: true });
  const newer = newerTakeOf({ takes: snapshot.takes ?? [], take });
  const canMark = !isReadOnlyTake({ take, newer });
  const draftOf = (itemId: string) =>
    canMark ? review.draftOf(itemId) : sentDraftOf({ take, itemId });
  const picks = picksOf({
    snapshot,
    review,
    ownIds: take.items.map((item) => item.id),
    reviewIds: reviewItemIdsOf({ snapshot, take }),
    canMark,
  });
  const filter = useTakeFilter({
    items,
    draftOf,
    inUseIds: picks.inUseIds,
  });
  const opened =
    view === undefined
      ? undefined
      : items.find((shown) => shown.item.id === view.itemId);
  const reviewedCount = items.filter(
    (shown) => verdictOfDraft(draftOf(shown.item.id)) !== undefined,
  ).length;
  return (
    <div className="take-view">
      <OlderTakeLine take={take} newer={newer} onGo={props.onPickTake} />
      <TakeSlate
        take={take}
        takes={snapshot.takes ?? []}
        chapters={props.chapters}
        progress={props.progress}
        onPickTake={props.onPickTake}
      />
      {items.length === 0 ? (
        <p className="fact lead">
          {take.state === "open"
            ? "The items of this take show here as they finish."
            : "This take has no items."}
        </p>
      ) : (
        <>
          <TakeFilters
            counts={filter.counts}
            picked={filter.picked}
            reviewedCount={reviewedCount}
            onPick={filter.pick}
          />
          {filter.shown.length === 0 ? (
            <p className="fact lead filter-empty">
              Nothing here right now.{" "}
              <button
                type="button"
                className="link"
                onClick={() => {
                  filter.pick("all");
                }}
              >
                Show all
              </button>
            </p>
          ) : (
            <TakeRows
              client={props.client}
              snapshot={snapshot}
              takeId={take.id}
              items={filter.shown}
              review={review}
              canMark={canMark}
              draftOf={draftOf}
              picks={picks}
              onOpen={setView}
            />
          )}
        </>
      )}
      {opened === undefined || view === undefined ? undefined : (
        <FullSize
          client={props.client}
          snapshot={snapshot}
          shown={opened}
          view={view}
          takeId={take.id}
          pins={draftOf(opened.item.id).pins}
          picks={picks}
          verdictOf={(itemId) => verdictOfDraft(draftOf(itemId))}
          onClose={() => {
            setView(undefined);
          }}
        />
      )}
    </div>
  );
}
