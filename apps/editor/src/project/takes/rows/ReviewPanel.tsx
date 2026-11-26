import type { Snapshot } from "../../../engine/snapshot.js";
import {
  captionOf,
  faultOf,
  replacedIdOf,
  takeNumberOfAsset,
  whatToCheckOf,
  type ShownKind,
} from "../itemFacts.js";
import {
  hasWords,
  type DraftChange,
  type DraftVerdict,
  type ItemDraft,
} from "../review/itemDrafts.js";
import type { SaveState } from "../review/useTakeReview.js";
import type { ShownItem } from "../shownItems.js";
import { MarkLines } from "./MarkLines.js";
import { NoteBox, TagChips, VerdictButtons } from "./ReviewControls.js";
import { SaveLine } from "./SaveLine.js";

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

export interface PanelState {
  draft: ItemDraft;
  save: SaveState | undefined;
  canMark: boolean;
  isLoaded: boolean;
  isInUse: boolean;
  focusId: string | undefined;
}

export function ReviewPanel(props: {
  snapshot: Snapshot;
  shown: ShownItem;
  kind: ShownKind;
  state: PanelState;
  onChange: (next: DraftChange) => void;
  onSaveAgain: () => void;
  onSeek: (seconds: number) => void;
  onCompare: () => void;
  onVerdict: (verdict: DraftVerdict) => void;
}) {
  const { shown, kind, state } = props;
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
  const save =
    state.save ??
    (hasWords(state.draft) || state.draft.verdict !== undefined
      ? { kind: "saved" as const }
      : undefined);
  return (
    <div className="review-panel">
      <h4 className="review-title">{captionOf(shown)}</h4>
      <p className="review-badges">
        <OriginBadge shown={shown} />
        {olderTake === undefined ? undefined : (
          <span className="badge">Replaces take {olderTake}</span>
        )}
        {state.isInUse ? (
          <span className="badge in-use">In use</span>
        ) : undefined}
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
      {olderTake === undefined ? undefined : (
        <button
          type="button"
          className="link compare-link"
          onClick={props.onCompare}
        >
          Compare with take {olderTake}
        </button>
      )}
      <fieldset
        className="review-fields"
        disabled={!state.canMark || !state.isLoaded}
        aria-label={`Your review of ${captionOf(shown)}`}
      >
        <VerdictButtons draft={state.draft} onVerdict={props.onVerdict} />
        <TagChips kind={kind} draft={state.draft} onChange={props.onChange} />
        <MarkLines
          kind={kind === "picture" ? "pins" : "moments"}
          draft={state.draft}
          focusId={state.focusId}
          onChange={props.onChange}
          onSeek={props.onSeek}
        />
        <NoteBox draft={state.draft} onChange={props.onChange} />
      </fieldset>
      {!state.canMark ? undefined : state.isLoaded ? (
        <SaveLine save={save} onSaveAgain={props.onSaveAgain} />
      ) : (
        <p className="save-line">Loading your review</p>
      )}
    </div>
  );
}
