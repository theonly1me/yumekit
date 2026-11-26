import type { Snapshot } from "../../../engine/snapshot.js";
import {
  captionOf,
  faultOf,
  isMoving,
  replacedIdOf,
  shownKindOf,
  takeNumberOfAsset,
  whatToCheckOf,
} from "../itemFacts.js";
import { isDropped } from "../notes/draftNotes.js";
import { NoteList } from "../notes/NoteList.js";
import type { TakeNotes } from "../notes/useDraftNotes.js";
import type { ShownItem } from "../shownItems.js";

function OriginBadge(props: { shown: ShownItem }) {
  const { shown } = props;
  switch (shown.origin) {
    case "new":
      return <span className="badge new">New in take {shown.takeNumber}</span>;
    case "earlier":
      return <span className="badge">Made before this take</span>;
    case "approved":
      return <span className="badge">Approved in take {shown.takeNumber}</span>;
  }
}

export function LargePanel(props: {
  snapshot: Snapshot;
  shown: ShownItem;
  notes: TakeNotes;
  focusId: string | undefined;
  canMark: boolean;
  onCompare: () => void;
}) {
  const { shown, notes } = props;
  const itemId = shown.item.id;
  const kind = shownKindOf(shown);
  const replaced = replacedIdOf(shown);
  const olderTake =
    replaced === undefined
      ? undefined
      : takeNumberOfAsset({
          takes: props.snapshot.takes ?? [],
          assetId: replaced,
        });
  const fault = faultOf({ shown, snapshot: props.snapshot });
  const check = whatToCheckOf(shown);
  const dropped = isDropped({ draft: notes.draft, itemId });
  return (
    <aside className="large-panel">
      <h3>{captionOf(shown)}</h3>
      <p className="large-badges">
        <OriginBadge shown={shown} />
        {olderTake === undefined ? undefined : (
          <span className="badge">Replaces take {olderTake}</span>
        )}
      </p>
      {fault === undefined ? undefined : <p className="tile-fault">{fault}</p>}
      {shown.item.note === undefined ? undefined : (
        <p className="lead-note">
          <span>The lead</span>
          {shown.item.note}
        </p>
      )}
      {check === undefined ? undefined : (
        <p className="check-line">
          <span>What to check</span>
          {check}
        </p>
      )}
      {props.canMark ? (
        <>
          <div className="simple-actions">
            <button
              type="button"
              aria-pressed={dropped}
              onClick={() => {
                notes.toggleDropped(itemId);
              }}
            >
              {dropped ? "Use this one again" : "Don't use this one"}
            </button>
            {olderTake === undefined ? undefined : (
              <button type="button" className="link" onClick={props.onCompare}>
                Compare with take {olderTake}
              </button>
            )}
          </div>
          <NoteList
            notes={notes}
            itemId={itemId}
            focusId={props.focusId}
            hint={
              isMoving(kind)
                ? "Mark a moment while it plays, or write a note."
                : "Click the picture to pin a point, or write a note."
            }
          />
        </>
      ) : undefined}
      <p className="large-keys">
        Keys: arrows for the next item, Esc to close.
      </p>
    </aside>
  );
}
