import { useState } from "react";
import { clockOf } from "../media/Player.js";
import { notesOfItem, type DraftNote } from "./draftNotes.js";
import type { TakeNotes } from "./useDraftNotes.js";
import "./notes.css";

function placeholderOf(note: DraftNote): string {
  switch (note.place.kind) {
    case "pin":
      return "What is wrong at this pin?";
    case "moment":
      return "What goes wrong here?";
    case "quote":
      return "What should change in this paragraph?";
    case "words":
      return "Your note";
  }
}

function NoteKey(props: { note: DraftNote; pinNumber: number }) {
  const { place } = props.note;
  if (place.kind === "pin") {
    return <span className="note-key pin-key">{props.pinNumber}</span>;
  }
  if (place.kind === "moment") {
    return (
      <span className="note-key moment-key">{clockOf(place.seconds)}</span>
    );
  }
  return <span className="note-key words-key">Note</span>;
}

export function NoteList(props: {
  notes: TakeNotes;
  itemId: string;
  focusId: string | undefined;
  hint: string;
}) {
  const { notes, itemId } = props;
  const [words, setWords] = useState("");
  const own = notesOfItem({ draft: notes.draft, itemId }).filter(
    (note) => note.place.kind !== "quote",
  );
  const pinIds = own
    .filter((note) => note.place.kind === "pin")
    .map((note) => note.id);
  return (
    <div className="note-list">
      {own.length === 0 ? undefined : (
        <ul className="take-notes" aria-label="Your notes">
          {own.map((...[note, index]) => (
            <li key={note.id} className="take-note">
              <NoteKey note={note} pinNumber={pinIds.indexOf(note.id) + 1} />
              <input
                type="text"
                value={note.text}
                autoFocus={note.id === props.focusId}
                placeholder={placeholderOf(note)}
                aria-label={`Note ${String(index + 1)}`}
                onChange={(event) => {
                  notes.write({ noteId: note.id, text: event.target.value });
                }}
              />
              <button
                type="button"
                className="remove"
                aria-label={`Remove note ${String(index + 1)}`}
                onClick={() => {
                  notes.remove(note.id);
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="note-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (words.trim() === "") return;
          notes.add({ itemId, place: { kind: "words" }, text: words.trim() });
          setWords("");
        }}
      >
        <input
          type="text"
          value={words}
          placeholder={props.hint}
          aria-label="A note for the lead"
          onChange={(event) => {
            setWords(event.target.value);
          }}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
