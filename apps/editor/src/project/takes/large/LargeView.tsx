import { useState } from "react";
import type { EngineClient } from "../../../engine/engineClient.js";
import type { Snapshot } from "../../../engine/snapshot.js";
import { captionOf, replacedIdOf } from "../itemFacts.js";
import { MediaStage } from "../media/MediaStage.js";
import type { TakeNotes } from "../notes/useDraftNotes.js";
import type { ShownItem } from "../shownItems.js";
import { CompareView } from "./CompareView.js";
import { LargePanel } from "./LargePanel.js";
import { useLargeKeys } from "./useLargeKeys.js";
import "./largeView.css";

export function LargeView(props: {
  client: EngineClient;
  snapshot: Snapshot;
  items: ShownItem[];
  openId: string;
  takeId: string;
  notes: TakeNotes;
  canMark: boolean;
  onOpen: (itemId: string | undefined) => void;
}) {
  const { items } = props;
  const [isComparing, setComparing] = useState(false);
  const [focusId, setFocusId] = useState<string>();
  const index = Math.max(
    0,
    items.findIndex((shown) => shown.item.id === props.openId),
  );
  const shown = items[index];
  const move = (step: number) => {
    const next = items[Math.min(items.length - 1, Math.max(0, index + step))];
    setComparing(false);
    props.onOpen(next?.item.id);
  };
  const close = () => {
    if (isComparing) setComparing(false);
    else props.onOpen(undefined);
  };
  useLargeKeys({ onMove: move, onEscape: close });
  if (shown === undefined) return undefined;
  const caption = captionOf(shown);
  const replaced = replacedIdOf(shown);
  return (
    <div
      className="take-large"
      role="dialog"
      aria-modal="true"
      aria-label={`Large view of ${caption}`}
    >
      <div className="large-top">
        <p>
          {index + 1} of {items.length}
        </p>
        <button
          type="button"
          onClick={() => {
            move(-1);
          }}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => {
            move(1);
          }}
        >
          Next
        </button>
        <button type="button" onClick={close}>
          Close
        </button>
      </div>
      {isComparing && replaced !== undefined ? (
        <CompareView
          client={props.client}
          snapshot={props.snapshot}
          shown={shown}
          olderId={replaced}
          takeId={props.takeId}
        />
      ) : (
        <div className="large-body">
          <div className="large-media">
            <MediaStage
              key={shown.item.id}
              client={props.client}
              shown={shown}
              takeId={props.takeId}
              notes={props.notes}
              framesPerSecond={props.snapshot.project.framesPerSecond}
              canMark={props.canMark}
              onNoteAdded={setFocusId}
            />
          </div>
          <LargePanel
            snapshot={props.snapshot}
            shown={shown}
            notes={props.notes}
            focusId={focusId}
            canMark={props.canMark}
            onCompare={() => {
              setComparing(true);
            }}
          />
        </div>
      )}
    </div>
  );
}
