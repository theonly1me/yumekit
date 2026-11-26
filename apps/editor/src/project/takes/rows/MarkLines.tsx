import { clockOf } from "../media/Player.js";
import {
  removeMark,
  writeMark,
  type DraftChange,
  type ItemDraft,
} from "../review/itemDrafts.js";

interface Mark {
  id: string;
  text: string;
  seconds?: number;
}

function keyOf(options: { mark: Mark; number: number }): string {
  const { seconds } = options.mark;
  return seconds === undefined ? String(options.number) : clockOf(seconds);
}

export function MarkLines(props: {
  kind: "pins" | "moments";
  draft: ItemDraft;
  focusId: string | undefined;
  onChange: (next: DraftChange) => void;
  onSeek: (seconds: number) => void;
}) {
  const { kind } = props;
  const marks: Mark[] =
    kind === "pins" ? props.draft.pins : props.draft.moments;
  const noun = kind === "pins" ? "pin" : "moment";
  if (marks.length === 0) return undefined;
  return (
    <ol
      className="mark-lines"
      aria-label={kind === "pins" ? "Pins" : "Moments"}
    >
      {marks.map((...[mark, index]) => {
        const name = `${noun} ${keyOf({ mark, number: index + 1 })}`;
        const { seconds } = mark;
        return (
          <li key={mark.id} className="mark-line">
            {seconds === undefined ? (
              <span className="mark-key">{index + 1}</span>
            ) : (
              <button
                type="button"
                className="mark-key"
                aria-label={`Go to ${clockOf(seconds)}`}
                onClick={() => {
                  props.onSeek(seconds);
                }}
              >
                {clockOf(seconds)}
              </button>
            )}
            <input
              type="text"
              value={mark.text}
              autoFocus={mark.id === props.focusId}
              placeholder={
                kind === "pins"
                  ? "What is wrong at this pin?"
                  : "What goes wrong here?"
              }
              aria-label={`Words for ${name}`}
              onChange={(event) => {
                props.onChange(
                  writeMark({ kind, id: mark.id, text: event.target.value }),
                );
              }}
            />
            <button
              type="button"
              className="mark-remove"
              aria-label={`Remove ${name}`}
              onClick={() => {
                props.onChange(removeMark({ kind, id: mark.id }));
              }}
            >
              Remove
            </button>
          </li>
        );
      })}
    </ol>
  );
}
