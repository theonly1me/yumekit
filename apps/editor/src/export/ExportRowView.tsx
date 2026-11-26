import type { ReactNode } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { ExportedFile } from "./done/ExportedFile.js";
import { shareOf, type ExportJob, type MadeFile } from "./exportJobs.js";
import type { ExportRow } from "./exportRows.js";

function statusOf(options: {
  client: EngineClient;
  row: ExportRow;
  job: ExportJob | undefined;
  scale: number;
}): ReactNode {
  const { row, job, scale } = options;
  if (row.lengthFrames === 0) {
    return <span className="fact">No scenes yet</span>;
  }
  if (job === undefined) {
    return (
      <span className="fact">
        {Math.round(row.output.widthPixels * scale)} x{" "}
        {Math.round(row.output.heightPixels * scale)}
      </span>
    );
  }
  if (job.state.kind === "failed") {
    return <span className="fact">Did not export</span>;
  }
  if (job.state.kind === "done") {
    return (
      <DoneFiles
        client={options.client}
        row={row}
        files={job.state.files}
        sharperFailure={job.state.sharperFailure}
      />
    );
  }
  if (job.state.kind === "waiting") {
    return <span className="fact">Waits for its turn</span>;
  }
  const percent = Math.round(shareOf(job.state) * 100);
  const progressLabel =
    job.state.kind === "sharpening"
      ? `Making the sharper copy of ${row.name}`
      : `Progress of ${row.name}`;
  return (
    <span
      className="progress small"
      role="progressbar"
      aria-label={progressLabel}
      title={
        job.state.kind === "sharpening" ? "Making the sharper copy" : undefined
      }
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <i style={{ width: `${String(percent)}%` }} />
    </span>
  );
}

function DoneFiles(props: {
  client: EngineClient;
  row: ExportRow;
  files: MadeFile[];
  sharperFailure: string | undefined;
}) {
  const ofRow = props.files.filter(
    (file) => file.platformId === props.row.platformId,
  );
  if (ofRow.length === 0) return <span className="fact">Not made</span>;
  return (
    <div className="export-made">
      {ofRow.map((made) => (
        <ExportedFile key={made.file} client={props.client} made={made} />
      ))}
      {props.sharperFailure === undefined ? undefined : (
        <p className="fact export-note" role="status">
          {props.sharperFailure}
        </p>
      )}
    </div>
  );
}

export function ExportRowView(props: {
  client: EngineClient;
  row: ExportRow;
  job: ExportJob | undefined;
  scale: number;
  isChosen: boolean;
  isLocked: boolean;
  onChoose: (isChosen: boolean) => void;
  failure: ReactNode;
}) {
  const { row } = props;
  return (
    <li className="export-row" data-state={props.job?.state.kind ?? "idle"}>
      <label>
        <input
          type="checkbox"
          checked={props.isChosen && row.lengthFrames > 0}
          disabled={props.isLocked || row.lengthFrames === 0}
          onChange={(event) => {
            props.onChoose(event.currentTarget.checked);
          }}
        />{" "}
        {row.name} <em>{row.shape}</em>
      </label>
      {props.job?.state.kind === "done" ? undefined : (
        <span className="export-file">{row.fileName}</span>
      )}
      {statusOf({
        client: props.client,
        row,
        job: props.job,
        scale: props.scale,
      })}
      {props.failure}
    </li>
  );
}
