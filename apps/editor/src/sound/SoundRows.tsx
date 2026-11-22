import type { SoundRow } from "./soundRowFacts.js";
import "./sound.css";

export function SoundRows(props: {
  rows: SoundRow[];
  failure: string | undefined;
  onSwitch: (change: { trackId: string; off: boolean }) => void;
  onChange: (rowName: string) => void;
}) {
  if (props.rows.length === 0) return undefined;
  return (
    <>
      <ul className="sound-rows" aria-label="Sound">
        {props.rows.map((row) => (
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
            <button
              type="button"
              aria-label={`Change the ${row.name.toLowerCase()}`}
              onClick={() => {
                props.onChange(row.name);
              }}
            >
              Change
            </button>
          </li>
        ))}
      </ul>
      {props.failure === undefined ? undefined : (
        <p className="change-failure" role="alert">
          {props.failure}
        </p>
      )}
    </>
  );
}
