import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { Sheet } from "../sheets/Sheet.js";
import type { ExportJob, SceneTarget } from "./exportJobs.js";
import { exportRowsOf, leadOf, outputIdsOf, videosWord } from "./exportRows.js";
import { ExportRowView } from "./ExportRowView.js";
import { FailedExport } from "./FailedExport.js";
import type { Exports } from "./useExports.js";
import "./export.css";

function headlineOf(exports: Exports): string {
  if (exports.isRunning) return "Exporting";
  if (exports.jobs.length === 0) return "Export the video";
  return exports.jobs.every((job) => job.state.kind === "done")
    ? "Your videos are ready"
    : "The export did not finish";
}

function rendersFolderOf(projectFolder: string): string {
  const separator = projectFolder.includes("\\") ? "\\" : "/";
  return `${projectFolder.replace(/[\\/]+$/, "")}${separator}renders`;
}

export function ExportSheet(props: {
  client: EngineClient;
  snapshot: Snapshot;
  projectFolder: string;
  exports: Exports;
  onClose: () => void;
  onOpenScene: (target: SceneTarget) => void;
}) {
  const { client, snapshot, exports } = props;
  const rows = exportRowsOf(snapshot);
  const jobOf = (outputId: string): ExportJob | undefined =>
    exports.jobs.find((job) => job.outputId === outputId);
  const [chosen, setChosen] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        rows
          .filter((row) =>
            exports.jobs.length > 0
              ? jobOf(row.output.id) !== undefined
              : row.lengthFrames > 0,
          )
          .map((row) => row.key),
      ),
  );
  const chosenRows = rows.filter(
    (row) => row.lengthFrames > 0 && chosen.has(row.key),
  );
  const failureShownFor = new Set<string>();

  return (
    <Sheet titleId="export-title" onClose={props.onClose}>
      <div className="sheet-body">
        <h2 id="export-title" aria-live="polite">
          {headlineOf(exports)}
        </h2>
        <p className="fact lead">
          One file for each place, in its own shape.{" "}
          {leadOf({ snapshot, rows })}
        </p>
        <ul className="export-rows" aria-label="Files to export">
          {rows.map((row) => {
            const job = jobOf(row.output.id);
            const failed =
              job?.state.kind === "failed" &&
              !failureShownFor.has(row.output.id)
                ? job.state
                : undefined;
            failureShownFor.add(row.output.id);
            return (
              <ExportRowView
                key={row.key}
                client={client}
                row={row}
                job={job}
                isChosen={chosen.has(row.key)}
                isLocked={exports.isRunning}
                onChoose={(isChosen) => {
                  const next = new Set(chosen);
                  if (isChosen) next.add(row.key);
                  else next.delete(row.key);
                  setChosen(next);
                }}
                failure={
                  failed === undefined ? undefined : (
                    <FailedExport
                      message={failed.message}
                      failedAt={failed.failedAt}
                      sceneTitle={
                        snapshot.scenes.find(
                          (scene) => scene.id === failed.failedAt?.sceneId,
                        )?.title
                      }
                      onOpenScene={(failedAt) => {
                        props.onOpenScene({
                          outputId: row.output.id,
                          ...failedAt,
                        });
                      }}
                    />
                  )
                }
              />
            );
          })}
        </ul>
        <div className="start-action">
          <button
            type="button"
            className="primary large"
            disabled={exports.isRunning || chosenRows.length === 0}
            onClick={() => {
              exports.start(outputIdsOf(chosenRows));
            }}
          >
            {exports.isRunning
              ? "Exporting"
              : `Export ${videosWord(chosenRows.length)}`}
          </button>
          <p className="fact">
            Files go to {rendersFolderOf(props.projectFolder)} on this computer.
            Nothing is uploaded.
          </p>
        </div>
      </div>
    </Sheet>
  );
}
