import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { sceneNameById } from "../names/index.js";
import type { ExportJob, ExportScale, SceneTarget } from "./exportJobs.js";
import type { ExportRow } from "./exportRows.js";
import { ExportRowView } from "./ExportRowView.js";
import { FailedExport } from "./FailedExport.js";
import {
  fileNameWithSize,
  type FileSizeChoice,
} from "./fileSize/fileSizeChoice.js";

export function ExportRowList(props: {
  client: EngineClient;
  snapshot: Snapshot;
  rows: ExportRow[];
  jobs: ExportJob[];
  chosenKeys: ReadonlySet<string>;
  scale: ExportScale;
  fileSize: FileSizeChoice;
  isLocked: boolean;
  onChoose: (options: { key: string; isChosen: boolean }) => void;
  onOpenScene: (target: SceneTarget) => void;
}) {
  const { snapshot } = props;
  const failureShownFor = new Set<string>();
  return (
    <ul className="export-rows" aria-label="Files to export">
      {props.rows.map((row) => {
        const job = props.jobs.find((each) => each.outputId === row.output.id);
        const failed =
          job?.state.kind === "failed" && !failureShownFor.has(row.output.id)
            ? job.state
            : undefined;
        failureShownFor.add(row.output.id);
        return (
          <ExportRowView
            key={row.key}
            client={props.client}
            row={{
              ...row,
              fileName: fileNameWithSize({
                fileName: row.fileName,
                choice: job?.fileSize ?? props.fileSize,
              }),
            }}
            job={job}
            scale={job?.scale ?? props.scale}
            isChosen={props.chosenKeys.has(row.key)}
            isLocked={props.isLocked}
            onChoose={(isChosen) => {
              props.onChoose({ key: row.key, isChosen });
            }}
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
                    props.onOpenScene({ outputId: row.output.id, ...failedAt });
                  }}
                />
              )
            }
          />
        );
      })}
    </ul>
  );
}
