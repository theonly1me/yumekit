import { stepActionLabels } from "../making/StepWhyLine.js";
import type { SoundAction, SoundNote } from "./soundNotes.js";

const noteActionLabels: Record<SoundAction, string> = {
  ...stepActionLabels,
  "record-the-voice-again": "Record the voice again",
  "add-a-voice": "Add a voice",
  "add-music": "Add music",
  "add-a-sound": "Add a sound",
  "add-captions": "Add captions",
};

const requestActions = new Set<SoundAction>([
  "make-the-rest",
  "try-again",
  "record-the-voice-again",
  "add-captions",
]);

function isRequestAction(action: SoundAction): boolean {
  return requestActions.has(action);
}

export function SoundNoteRow(props: {
  note: SoundNote;
  disabled: boolean;
  onAction: (action: SoundAction) => void;
}) {
  const { note } = props;
  return (
    <li
      className="sound-row sound-note"
      data-part={note.name.toLowerCase() || note.part}
    >
      <span className="sound-name">{note.name}</span>
      <span className="sound-note-text" role="status">
        {note.text}
      </span>
      <span className="sound-note-actions">
        {note.actions.map((action) => (
          <button
            key={action}
            type="button"
            disabled={props.disabled && isRequestAction(action)}
            onClick={() => {
              props.onAction(action);
            }}
          >
            {noteActionLabels[action]}
          </button>
        ))}
      </span>
    </li>
  );
}
