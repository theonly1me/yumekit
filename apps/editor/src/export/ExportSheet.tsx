import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { useMediaChoices } from "../settings/services/index.js";
import { Sheet } from "../sheets/Sheet.js";
import { sceneNameById } from "../names/index.js";
import { useMediaServers } from "../tools/useMediaServers.js";
import type { ExportJob, ExportScale, SceneTarget } from "./exportJobs.js";
import { ExportSize } from "./ExportSize.js";
import { exportRowsOf, leadOf, outputIdsOf, videosWord } from "./exportRows.js";
import { ExportRowView } from "./ExportRowView.js";
import { FailedExport } from "./FailedExport.js";
import { sharperChoiceOf } from "./sharperChoice.js";
import { sharperRequestsOf } from "./sharperRequests.js";
import { SharperSwitch } from "./SharperSwitch.js";
import type { Exports } from "./useExports.js";
import "./export.css";

function headlineOf(exports: Exports): string {
  if (exports.isRunning) return "Exporting";
  if (exports.jobs.length === 0) return "Export the video";
  const files = exports.jobs.flatMap((job) =>
    job.state.kind === "done" ? job.state.files : [],
  );
  if (!exports.jobs.every((job) => job.state.kind === "done")) {
    return "The export did not finish";
  }
  return files.length === 1 ? "Your video is ready" : "Your videos are ready";
}

function rendersFolderOf(projectFolder: string): string {
  const separator = projectFolder.includes("\\") ? "\\" : "/";
  return `${projectFolder.replace(/[\\/]+$/, "")}${separator}renders`;
}

function shortRendersFolderOf(projectFolder: string): string {
  const folderName =
    projectFolder
      .split(/[\\/]+/)
      .filter((part) => part !== "")
      .at(-1) ?? "";
  return `${folderName}/renders`;
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
  const sharperChoice = sharperChoiceOf({
    choices: useMediaChoices(client).state,
    servers: useMediaServers(client).state,
  });
  const [sharperKeys, setSharperKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const sharperRows =
    sharperChoice === undefined
      ? []
      : chosenRows.filter((row) => sharperKeys.has(row.key));
  const failureShownFor = new Set<string>();
  const [scale, setScale] = useState<ExportScale>(1);

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
                scale={job?.scale ?? scale}
                isChosen={chosen.has(row.key)}
                isLocked={exports.isRunning}
                onChoose={(isChosen) => {
                  const next = new Set(chosen);
                  if (isChosen) next.add(row.key);
                  else next.delete(row.key);
                  setChosen(next);
                }}
                sharper={
                  sharperChoice === undefined ||
                  !chosen.has(row.key) ||
                  row.lengthFrames === 0 ? undefined : (
                    <SharperSwitch
                      row={row}
                      choice={sharperChoice}
                      framesPerSecond={snapshot.project.framesPerSecond}
                      isOn={sharperKeys.has(row.key)}
                      isLocked={exports.isRunning}
                      onChange={(isOn) => {
                        const next = new Set(sharperKeys);
                        if (isOn) next.add(row.key);
                        else next.delete(row.key);
                        setSharperKeys(next);
                      }}
                    />
                  )
                }
                failure={
                  failed === undefined ? undefined : (
                    <FailedExport
                      message={failed.message}
                      failedAt={failed.failedAt}
                      sceneTitle={
                        failed.failedAt === undefined
                          ? undefined
                          : sceneNameById({
                              sceneId: failed.failedAt.sceneId,
                              scenes: snapshot.scenes,
                              assets: snapshot.assets,
                            })
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
        <ExportSize
          scale={scale}
          isLocked={exports.isRunning}
          onScale={setScale}
        />
        <div className="start-action">
          <button
            type="button"
            className="primary large"
            disabled={exports.isRunning || chosenRows.length === 0}
            onClick={() => {
              exports.start({
                outputIds: outputIdsOf(chosenRows),
                sharper: sharperRequestsOf(sharperRows),
                scale,
              });
            }}
          >
            {exports.isRunning
              ? "Exporting"
              : `Export ${videosWord(chosenRows.length)}`}
          </button>
          <p className="fact">
            Files go to{" "}
            <span title={rendersFolderOf(props.projectFolder)}>
              {shortRendersFolderOf(props.projectFolder)}
            </span>{" "}
            on this computer. Nothing is uploaded.
          </p>
        </div>
      </div>
    </Sheet>
  );
}
