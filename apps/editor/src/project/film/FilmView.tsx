import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { pickVerdict } from "../takes/review/itemDrafts.js";
import { sentDraftOf } from "../takes/review/sentDraft.js";
import type { TakeReview } from "../takes/review/useTakeReview.js";
import { ReviewRow } from "../takes/rows/ReviewRow.js";
import { shownItemsOf } from "../takes/shownItems.js";
import type { Take } from "../takes/takeTypes.js";
import "../takes/media/media.css";
import "../takes/takeView.css";
import "./film.css";

export function FilmView(props: {
  client: EngineClient;
  snapshot: Snapshot;
  take: Take | undefined;
  chapterLine: string;
  review: TakeReview;
}) {
  const { take, snapshot, review } = props;
  const cut =
    take === undefined
      ? undefined
      : shownItemsOf({ snapshot, take, withEarlier: false }).find(
          (shown) => shown.item.kind === "cut",
        );
  if (take === undefined || cut === undefined) {
    return (
      <div className="work-wait">
        <p className="work-title">No cut yet</p>
        <p className="fact lead">
          The lead puts the chapter together when you approve its clips.
        </p>
      </div>
    );
  }
  const itemId = cut.item.id;
  const canMark = take.state === "ready";
  return (
    <div className="film">
      <p className="film-title">{props.chapterLine}</p>
      <ReviewRow
        client={props.client}
        snapshot={snapshot}
        shown={cut}
        takeId={take.id}
        state={{
          draft:
            take.state === "sent"
              ? sentDraftOf({ take, itemId })
              : review.draftOf(itemId),
          save: review.saveOf(itemId),
          canMark,
          isLoaded: !canMark || review.isLoaded,
          isInUse: false,
        }}
        onChange={(next) => {
          review.change({ itemId, next });
        }}
        onSaveAgain={() => {
          review.saveAgain(itemId);
        }}
        onOpen={() => undefined}
        onVerdict={(verdict) => {
          review.change({ itemId, next: pickVerdict(verdict) });
        }}
      />
    </div>
  );
}
