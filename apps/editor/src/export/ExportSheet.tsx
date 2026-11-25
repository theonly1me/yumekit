import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { useMediaChoices } from "../settings/services/index.js";
import { Sheet } from "../sheets/Sheet.js";
import { useMediaServers } from "../tools/useMediaServers.js";
import type { ExportScale, SceneTarget } from "./exportJobs.js";
import {
  longestVideoOf,
  rendersFolderOf,
  shortRendersFolderOf,
  withKey,
} from "./exportSheetFacts.js";
import { ExportMore } from "./ExportMore.js";
import { ExportRowList } from "./ExportRowList.js";
import { exportRowsOf, leadOf, outputIdsOf, videosWord } from "./exportRows.js";
import {
  bestQuality,
  planOf,
  type FileSizeChoice,
} from "./fileSize/fileSizeChoice.js";
import { FileSizeView } from "./fileSize/FileSizeView.js";
import { sharperChoiceOf } from "./sharperChoice.js";
import { sharperRequestsOf } from "./sharperRequests.js";
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
  const [chosen, setChosen] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        rows
          .filter((row) =>
            exports.jobs.length > 0
              ? exports.jobs.some((job) => job.outputId === row.output.id)
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
  const [scale, setScale] = useState<ExportScale>(1);
  const [fileSize, setFileSize] = useState<FileSizeChoice>(bestQuality);
  const { framesPerSecond } = snapshot.project;
  const video = longestVideoOf({ rows: chosenRows, scale, framesPerSecond });
  const isTooSmall =
    fileSize.kind === "smaller" &&
    video !== undefined &&
    planOf({ choice: fileSize, video }).look === "too-small";

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
        <div className="export-places">
          <ExportRowList
            client={client}
            snapshot={snapshot}
            rows={rows}
            jobs={exports.jobs}
            chosenKeys={chosen}
            scale={scale}
            fileSize={fileSize}
            isLocked={exports.isRunning}
            onChoose={({ key, isChosen }) => {
              setChosen(withKey({ keys: chosen, key, isIn: isChosen }));
            }}
            onOpenScene={props.onOpenScene}
          />
          <FileSizeView
            choice={fileSize}
            video={video}
            isLocked={exports.isRunning}
            onChoose={setFileSize}
          />
        </div>
        <ExportMore
          rows={chosenRows}
          framesPerSecond={framesPerSecond}
          scale={scale}
          isLocked={exports.isRunning}
          onScale={setScale}
          sharperChoice={sharperChoice}
          sharperKeys={sharperKeys}
          onSharper={({ key, isOn }) => {
            setSharperKeys(withKey({ keys: sharperKeys, key, isIn: isOn }));
          }}
        />
        <div className="start-action">
          <button
            type="button"
            className="primary large"
            disabled={
              exports.isRunning || chosenRows.length === 0 || isTooSmall
            }
            onClick={() => {
              exports.start({
                outputIds: outputIdsOf(chosenRows),
                sharper: sharperRequestsOf({
                  rows: chosenRows.filter((row) => sharperKeys.has(row.key)),
                  target: sharperChoice?.target,
                }),
                scale,
                fileSize,
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
