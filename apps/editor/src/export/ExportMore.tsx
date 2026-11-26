import type { ExportScale } from "./exportJobs.js";
import type { ExportRow } from "./exportRows.js";
import { ExportSize } from "./ExportSize.js";
import type { SharperChoice } from "./sharperChoice.js";
import { SharperSwitch } from "./SharperSwitch.js";

export function ExportMore(props: {
  rows: ExportRow[];
  framesPerSecond: number;
  scale: ExportScale;
  isLocked: boolean;
  onScale: (scale: ExportScale) => void;
  sharperChoice: SharperChoice | undefined;
  sharperKeys: ReadonlySet<string>;
  onSharper: (options: { key: string; isOn: boolean }) => void;
}) {
  const { sharperChoice } = props;
  return (
    <details className="more">
      <summary>More</summary>
      <div className="more-body">
        <ExportSize
          scale={props.scale}
          isLocked={props.isLocked}
          onScale={props.onScale}
        />
        {sharperChoice === undefined || props.rows.length === 0 ? undefined : (
          <div className="export-sharpers">
            {props.rows.map((row) => (
              <SharperSwitch
                key={row.key}
                row={row}
                choice={sharperChoice}
                framesPerSecond={props.framesPerSecond}
                isOn={props.sharperKeys.has(row.key)}
                isLocked={props.isLocked}
                onChange={(isOn) => {
                  props.onSharper({ key: row.key, isOn });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
