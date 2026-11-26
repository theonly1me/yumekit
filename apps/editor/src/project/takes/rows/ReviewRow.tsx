import { useRef, useState } from "react";
import type { EngineClient } from "../../../engine/engineClient.js";
import type { Snapshot } from "../../../engine/snapshot.js";
import { captionOf, replacedIdOf, shownKindOf } from "../itemFacts.js";
import type { FullSizeView } from "../large/FullSize.js";
import type { PlayerMedia } from "../media/Player.js";
import {
  verdictOfDraft,
  type DraftChange,
  type DraftVerdict,
} from "../review/itemDrafts.js";
import type { ShownItem } from "../shownItems.js";
import { ReviewPanel, type PanelState } from "./ReviewPanel.js";
import { RowMedia } from "./RowMedia.js";
import "./reviewControls.css";
import "./rows.css";

export function ReviewRow(props: {
  client: EngineClient;
  snapshot: Snapshot;
  shown: ShownItem;
  takeId: string;
  state: Omit<PanelState, "focusId">;
  onChange: (next: DraftChange) => void;
  onSaveAgain: () => void;
  onOpen: (view: FullSizeView) => void;
  onVerdict: (verdict: DraftVerdict) => void;
}) {
  const { shown, state } = props;
  const mediaRef = useRef<PlayerMedia | null>(null);
  const [focusId, setFocusId] = useState<string>();
  const kind = shownKindOf(shown);
  const itemId = shown.item.id;
  const replaced = replacedIdOf(shown);
  return (
    <article
      className="review-row"
      id={`review-${itemId}`}
      data-kind={kind}
      data-verdict={verdictOfDraft(state.draft) ?? "none"}
      aria-label={captionOf(shown)}
    >
      <div className="row-media">
        <RowMedia
          client={props.client}
          snapshot={props.snapshot}
          shown={shown}
          kind={kind}
          takeId={props.takeId}
          draft={state.draft}
          canMark={state.canMark && state.isLoaded}
          onMedia={(element) => {
            mediaRef.current = element;
          }}
          onChange={props.onChange}
          onMarkAdded={setFocusId}
          onFullSize={() => {
            props.onOpen({ kind: "picture", itemId });
          }}
        />
      </div>
      <ReviewPanel
        snapshot={props.snapshot}
        shown={shown}
        kind={kind}
        state={{ ...state, focusId }}
        onChange={props.onChange}
        onSaveAgain={props.onSaveAgain}
        onSeek={(seconds) => {
          const element = mediaRef.current;
          if (element === null) return;
          element.pause();
          element.currentTime = seconds;
        }}
        onCompare={() => {
          if (replaced === undefined) return;
          props.onOpen({ kind: "compare", itemId, olderId: replaced });
        }}
        onVerdict={props.onVerdict}
      />
    </article>
  );
}
