import type { SoundAction, SoundNote } from "./soundNotes.js";
import { SoundNoteRow } from "./SoundNoteRow.js";
import type { SoundPartName, SoundRow } from "./soundRowFacts.js";
import "./sound.css";

export function SoundRows(props: {
  rows: SoundRow[];
  notes: SoundNote[];
  isChatRunning: boolean;
  onNoteAction: (choice: { note: SoundNote; action: SoundAction }) => void;
  failure: string | undefined;
  onSwitch: (change: { trackId: string; off: boolean }) => void;
  onChange: (rowName: string) => void;
  onOpen: (part: SoundPartName) => void;
}) {
  if (props.rows.length === 0 && props.notes.length === 0) return undefined;
  const noteRowsOf = (trackId: string | undefined) =>
    props.notes
      .filter((note) => note.trackId === trackId)
      .map((note) => (
        <SoundNoteRow
          key={`${note.part}-${note.text}`}
          note={note}
          disabled={props.isChatRunning}
          onAction={(action) => {
            props.onNoteAction({ note, action });
          }}
        />
      ));
  return (
    <>
      <ul className="sound-rows" aria-label="Sound">
        {props.rows.map((row) => [
          <li key={row.trackId} className="sound-row" data-on={!row.isOff}>
            <span className="sound-name">{row.name}</span>
            <span className="sound-choice" title={row.choice}>
              {row.isOff ? "Off" : row.choice}
            </span>
            <label className="switch">
              <input
                type="checkbox"
                role="switch"
                aria-label={`${row.name} on`}
                checked={!row.isOff}
                onChange={(event) => {
                  props.onSwitch({
                    trackId: row.trackId,
                    off: !event.currentTarget.checked,
                  });
                }}
              />{" "}
              On
            </label>
            {row.part === undefined ? (
              <button
                type="button"
                aria-label={`Change the ${row.name.toLowerCase()}`}
                onClick={() => {
                  props.onChange(row.name);
                }}
              >
                Change
              </button>
            ) : (
              <button
                type="button"
                aria-label={`Open the ${row.name.toLowerCase()}`}
                onClick={() => {
                  if (row.part !== undefined) props.onOpen(row.part);
                }}
              >
                Open
              </button>
            )}
          </li>,
          ...noteRowsOf(row.trackId),
        ])}
        {noteRowsOf(undefined)}
      </ul>
      {props.failure === undefined ? undefined : (
        <p className="change-failure" role="alert">
          {props.failure}
        </p>
      )}
    </>
  );
}
