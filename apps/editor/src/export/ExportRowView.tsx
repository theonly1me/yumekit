import { useState, type ReactNode } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { shareOf, type ExportJob, type MadeFile } from "./exportJobs.js";
import type { ExportRow } from "./exportRows.js";
import { openVideoFile, type OpenOutcome } from "./openVideoFile.js";

function openMessageOf(outcome: OpenOutcome | undefined): ReactNode {
  if (outcome === undefined || outcome.kind === "opened") return undefined;
  if (outcome.kind === "too-large") {
    return "The file is too large to open here. Open it from the folder above in your video player.";
  }
  if (outcome.kind === "failed") return outcome.message;
  return (
    <>
      The browser blocked the new tab.{" "}
      <a href={outcome.url} target="_blank" rel="noreferrer">
        Open the video
      </a>
    </>
  );
}

function ShowFile(props: { client: EngineClient; made: MadeFile }) {
  const [opened, setOpened] = useState<OpenOutcome>();
  const message = openMessageOf(opened);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpened(undefined);
          openVideoFile({ client: props.client, fileName: props.made.fileName })
            .then(setOpened)
            .catch((error: unknown) => {
              setOpened({ kind: "failed", message: String(error) });
            });
        }}
      >
        Show the file
      </button>
      {message === undefined ? undefined : (
        <p className="fact export-note" role="status">
          {message}
        </p>
      )}
    </>
  );
}

function statusOf(options: {
  client: EngineClient;
  row: ExportRow;
  job: ExportJob | undefined;
}): ReactNode {
  const { row, job } = options;
  if (row.lengthFrames === 0) {
    return <span className="fact">No scenes yet</span>;
  }
  if (job === undefined) {
    return (
      <span className="fact">
        {row.output.widthPixels} x {row.output.heightPixels}
      </span>
    );
  }
  if (job.state.kind === "failed") {
    return <span className="fact">Did not export</span>;
  }
  if (job.state.kind === "done") {
    const made = job.state.files.find(
      (file) => file.platformId === row.platformId,
    );
    return made === undefined ? (
      <span className="fact">Not made</span>
    ) : (
      <ShowFile client={options.client} made={made} />
    );
  }
  const percent = Math.round(shareOf(job.state) * 100);
  return (
    <span
      className="progress small"
      role="progressbar"
      aria-label={`Progress of ${row.name}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <i style={{ width: `${String(percent)}%` }} />
    </span>
  );
}

export function ExportRowView(props: {
  client: EngineClient;
  row: ExportRow;
  job: ExportJob | undefined;
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
      <span className="export-file">{row.fileName}</span>
      {statusOf({ client: props.client, row, job: props.job })}
      {props.failure}
    </li>
  );
}
