import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import {
  captionOf,
  faultOf,
  shownKindOf,
  type ShownKind,
} from "./itemFacts.js";
import { useItemUrl } from "./media/useItemUrl.js";
import { isDropped, noteCountOf, type TakeDraft } from "./notes/draftNotes.js";
import { sectionNames, type ShownItem } from "./shownItems.js";
import "./contactSheet.css";

function Thumb(props: {
  client: EngineClient;
  shown: ShownItem;
  kind: ShownKind;
  takeId: string;
}) {
  const url = useItemUrl({
    client: props.client,
    item: props.shown.item,
    takeId: props.takeId,
  });
  if (props.kind === "music") {
    return <span className="tile-wave">{captionOf(props.shown)}</span>;
  }
  if (url === undefined) return <span className="tile-wait" />;
  return props.kind === "picture" ? (
    <img src={url} alt="" />
  ) : (
    <video src={url} muted preload="metadata" />
  );
}

function Tile(props: {
  client: EngineClient;
  snapshot: Snapshot;
  shown: ShownItem;
  takeId: string;
  takeNumber: number;
  draft: TakeDraft;
  onOpen: () => void;
}) {
  const { shown, draft } = props;
  const itemId = shown.item.id;
  const dropped = isDropped({ draft, itemId });
  const count = noteCountOf({ draft, itemId }) - (dropped ? 1 : 0);
  const isMarked = dropped || count > 0;
  const caption = captionOf(shown);
  const fault = faultOf({ shown, snapshot: props.snapshot });
  const kind = shownKindOf(shown);
  return (
    <li className="tile" data-marked={isMarked} data-out={dropped}>
      <button
        type="button"
        className="tile-open"
        aria-label={`Open ${caption}`}
        onClick={props.onOpen}
      >
        <span className="tile-picture" data-kind={kind}>
          <Thumb
            client={props.client}
            shown={shown}
            kind={kind}
            takeId={props.takeId}
          />
          {shown.isNew && props.takeNumber > 1 ? (
            <span className="tile-new">New</span>
          ) : undefined}
          {isMarked ? (
            <span className="tile-notes">
              {dropped
                ? "Not used"
                : `${String(count)} ${count === 1 ? "note" : "notes"}`}
            </span>
          ) : undefined}
        </span>
        <span className="tile-caption">{caption}</span>
        {fault === undefined ? undefined : (
          <span className="tile-fault">{fault}</span>
        )}
      </button>
    </li>
  );
}

export function ContactSheet(props: {
  client: EngineClient;
  snapshot: Snapshot;
  items: ShownItem[];
  takeId: string;
  takeNumber: number;
  draft: TakeDraft;
  onOpen: (itemId: string) => void;
}) {
  const sections = [...new Set(props.items.map((shown) => shown.section))];
  return sections.map((section) => (
    <section
      key={section}
      className="contact"
      aria-label={sectionNames[section]}
    >
      <h3>{sectionNames[section]}</h3>
      <ul className="contact-sheet">
        {props.items
          .filter((shown) => shown.section === section)
          .map((shown) => (
            <Tile
              key={shown.item.id}
              client={props.client}
              snapshot={props.snapshot}
              takeId={props.takeId}
              takeNumber={props.takeNumber}
              draft={props.draft}
              shown={shown}
              onOpen={() => {
                props.onOpen(shown.item.id);
              }}
            />
          ))}
      </ul>
    </section>
  ));
}
