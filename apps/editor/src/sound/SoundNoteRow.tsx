import { stepActionLabels } from "../making/StepWhyLine.js";
import type { SoundAction, SoundNote } from "./soundNotes.js";

const noteActionLabels: Record<SoundAction, string> = {
  ...stepActionLabels,
  "record-the-voice-again": "Record the voice again",
};

function isRequestAction(action: SoundAction): boolean {
  return action !== "add-a-key" && action !== "use-my-own-music";
}

export function SoundNoteRow(props: {
  note: SoundNote;
  disabled: boolean;
  onAction: (action: SoundAction) => void;
}) {
  const { note } = props;
  return (
    <li className="sound-row sound-note" data-part={note.part}>
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
