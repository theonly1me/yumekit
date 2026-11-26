import { useEffect, useRef, type MouseEvent } from "react";
import type { EngineClient } from "../../../engine/engineClient.js";
import type { Snapshot } from "../../../engine/snapshot.js";
import { captionOf } from "../itemFacts.js";
import { PinnedPicture } from "../media/PinnedPicture.js";
import { useItemUrl } from "../media/useItemUrl.js";
import type { DraftVerdict, ItemDraft } from "../review/itemDrafts.js";
import type { Picks } from "../review/picks.js";
import type { ShownItem } from "../shownItems.js";
import { CompareView } from "./CompareView.js";
import "./largeView.css";

export type FullSizeView =
  | { kind: "picture"; itemId: string }
  | { kind: "compare"; itemId: string; olderId: string };

function useEscapeKey(onEscape: () => void): void {
  const latest = useRef(onEscape);

  useEffect(() => {
    latest.current = onEscape;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      latest.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
    };
  }, []);
}

export function FullSize(props: {
  client: EngineClient;
  snapshot: Snapshot;
  shown: ShownItem;
  view: FullSizeView;
  takeId: string;
  pins: ItemDraft["pins"];
  picks: Picks;
  verdictOf: (itemId: string) => DraftVerdict | undefined;
  onClose: () => void;
}) {
  const { shown, view, onClose } = props;
  useEscapeKey(onClose);
  const url = useItemUrl({
    client: props.client,
    item: shown.item,
    takeId: props.takeId,
  });
  const caption = captionOf(shown);
  const closeOutside = (event: MouseEvent<HTMLElement>) => {
    if (event.target === event.currentTarget) onClose();
  };
  return (
    <div
      className="full-size"
      role="dialog"
      aria-modal="true"
      aria-label={
        view.kind === "compare"
          ? `Compare ${caption}`
          : `Full size of ${caption}`
      }
      onClick={closeOutside}
    >
      <div className="full-size-top" onClick={closeOutside}>
        <p>{caption}</p>
        <button type="button" autoFocus onClick={onClose}>
          Close
        </button>
      </div>
      {view.kind === "compare" ? (
        <CompareView
          client={props.client}
          snapshot={props.snapshot}
          shown={shown}
          olderId={view.olderId}
          takeId={props.takeId}
          picks={props.picks}
          verdictOf={props.verdictOf}
        />
      ) : (
        <div className="full-size-stage" onClick={closeOutside}>
          <PinnedPicture
            url={url}
            caption={caption}
            pins={props.pins}
            onPin={undefined}
          />
        </div>
      )}
    </div>
  );
}
