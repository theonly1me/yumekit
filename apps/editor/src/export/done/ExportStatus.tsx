import type { EngineClient } from "../../engine/engineClient.js";
import type { ExportEntry } from "./exportEntry.js";
import { ExportedFile } from "./ExportedFile.js";
import { jobNameOf, percentOf, runningLineOf } from "./exportWords.js";
import { madeFilesOf } from "./jobsOfEntry.js";
import type { ProgressByCall } from "./useExportProgress.js";
import "./exportedFile.css";

function sentenceOf(words: string): string {
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

function doneLineOf(entry: ExportEntry): string {
  if (entry.state === "failed") return "The export did not finish.";
  const fileCount = entry.jobs.flatMap((job) => job.files).length;
  const files = fileCount === 1 ? "The file is" : "The files are";
  return entry.by === "approval"
    ? `You approved the film, so yumekit exported it. ${files} in the exports folder of the project.`
    : `${files} in the exports folder of the project.`;
}

export function ExportStatus(props: {
  client: EngineClient;
  entry: ExportEntry;
  progress: ProgressByCall;
  onExportAgain?: (() => void) | undefined;
}) {
  const { entry, progress } = props;
  if (entry.state === "running") {
    const job = entry.jobs.find((each) => each.state === "exporting");
    const percent = job === undefined ? 0 : percentOf({ job, progress });
    return (
      <div className="export-running">
        <p aria-live="polite">{runningLineOf({ entry, progress })}</p>
        <span
          className="progress"
          role="progressbar"
          aria-label="Progress of the export"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <i style={{ width: `${String(percent)}%` }} />
        </span>
        <p className="fact">
          The files go to the exports folder of the project. You can keep
          working.
        </p>
      </div>
    );
  }
  return (
    <div className="export-done">
      <p>{doneLineOf(entry)}</p>
      {entry.jobs.flatMap((job) =>
        job.state === "done"
          ? madeFilesOf(job).map((made) => (
              <ExportedFile key={made.file} client={props.client} made={made} />
            ))
          : [
              <p key={job.callId} className="export-failed">
                {`${sentenceOf(jobNameOf(job))} did not export. ${job.failure?.message ?? ""}`.trim()}
              </p>,
            ],
      )}
      {entry.state === "failed" && props.onExportAgain !== undefined ? (
        <div className="export-actions">
          <button type="button" onClick={props.onExportAgain}>
            Export again
          </button>
        </div>
      ) : undefined}
    </div>
  );
}
