import type { EngineClient } from "../../../engine/engineClient.js";
import { captionOf, shownKindOf } from "../itemFacts.js";
import { notesOfItem } from "../notes/draftNotes.js";
import type { TakeNotes } from "../notes/useDraftNotes.js";
import type { ShownItem } from "../shownItems.js";
import { Player } from "./Player.js";
import { useItemUrl } from "./useItemUrl.js";

function fraction(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 1000) / 1000;
}

export function MediaStage(props: {
  client: EngineClient;
  shown: ShownItem;
  takeId: string;
  notes: TakeNotes;
  framesPerSecond: number;
  canMark: boolean;
  onNoteAdded: (noteId: string) => void;
}) {
  const { shown, notes } = props;
  const itemId = shown.item.id;
  const url = useItemUrl({
    client: props.client,
    item: shown.item,
    takeId: props.takeId,
  });
  const kind = shownKindOf(shown);
  const own = notesOfItem({ draft: notes.draft, itemId });
  if (kind !== "picture") {
    return (
      <Player
        url={url}
        isSound={kind === "music"}
        title={captionOf(shown)}
        framesPerSecond={props.framesPerSecond}
        moments={own.flatMap((note) =>
          note.place.kind === "moment" ? [note.place.seconds] : [],
        )}
        onMark={
          props.canMark
            ? (seconds) => {
                props.onNoteAdded(
                  notes.add({
                    itemId,
                    place: { kind: "moment", seconds },
                    text: "",
                  }),
                );
              }
            : undefined
        }
      />
    );
  }
  const pins = own.filter((note) => note.place.kind === "pin");
  return (
    <div className="player-box">
      <div
        className="stage-box"
        data-kind="picture"
        onClick={(event) => {
          if (!props.canMark) return;
          const box = event.currentTarget.getBoundingClientRect();
          const x = fraction((event.clientX - box.left) / box.width);
          const y = fraction((event.clientY - box.top) / box.height);
          props.onNoteAdded(
            notes.add({ itemId, place: { kind: "pin", x, y }, text: "" }),
          );
        }}
      >
        {url === undefined ? undefined : (
          <img src={url} alt={captionOf(shown)} />
        )}
        {pins.map((...[note, index]) =>
          note.place.kind === "pin" ? (
            <span
              key={note.id}
              className="pin"
              style={{
                left: `${String(note.place.x * 100)}%`,
                top: `${String(note.place.y * 100)}%`,
              }}
            >
              {index + 1}
            </span>
          ) : undefined,
        )}
      </div>
      {props.canMark ? (
        <p className="fact">
          Click the picture to pin a point. Each pin gets its own words.
        </p>
      ) : undefined}
    </div>
  );
}
