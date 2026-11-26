import type { ExportRow } from "./exportRows.js";
import { sharperPriceText, type SharperChoice } from "./sharperChoice.js";

export function SharperSwitch(props: {
  row: ExportRow;
  choice: SharperChoice;
  framesPerSecond: number;
  isOn: boolean;
  isLocked: boolean;
  onChange: (isOn: boolean) => void;
}) {
  const { row, choice } = props;
  const seconds = row.lengthFrames / props.framesPerSecond;
  return (
    <div className="export-sharper">
      <label>
        <input
          type="checkbox"
          role="switch"
          aria-label={`Sharper copy of ${row.name}`}
          checked={props.isOn}
          disabled={props.isLocked}
          onChange={(event) => {
            props.onChange(event.currentTarget.checked);
          }}
        />{" "}
        Sharper copy of {row.name}
      </label>
      <span className="fact">
        {sharperPriceText({ choice, seconds })}{" "}
        {choice.isTestService
          ? "The free test service makes a plain larger copy."
          : `Made with ${choice.target.modelLabel ?? choice.target.serverLabel}.`}
      </span>
    </div>
  );
}
