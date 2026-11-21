import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { openRenderFile, type OpenOutcome } from "./openRenderFile.js";
import { FailedRender } from "./FailedRender.js";
import type { RenderJob, SceneTarget } from "./renderJobs.js";

function statusOf(job: RenderJob): string {
  switch (job.state.kind) {
    case "waiting":
      return "Waiting";
    case "rendering":
      return job.state.frameCount === undefined
        ? "Starting"
        : `${String(job.state.framesDone)} of ${String(job.state.frameCount)} frames`;
    case "done":
      return `Done, ${job.state.durationSeconds.toFixed(1)} seconds`;
    case "failed":
      return "Did not render";
  }
}

function openMessageOf(outcome: OpenOutcome | undefined) {
  if (outcome === undefined || outcome.kind === "opened") return undefined;
  if (outcome.kind === "too-large") {
    return "The file is too large to open here. Copy the path and open it in your video player.";
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

function DoneActions(props: {
  client: EngineClient;
  file: string;
  fileName: string;
}) {
  const [opened, setOpened] = useState<OpenOutcome>();
  const [copied, setCopied] = useState<string>();
  return (
    <>
      <p className="render-path">{props.file}</p>
      <div className="render-actions">
        <button
          type="button"
          onClick={() => {
            setOpened(undefined);
            openRenderFile({ client: props.client, fileName: props.fileName })
              .then(setOpened)
              .catch((error: unknown) => {
                setOpened({ kind: "failed", message: String(error) });
              });
          }}
        >
          Open the video
        </button>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(props.file).then(
              () => {
                setCopied("Copied.");
              },
              () => {
                setCopied(
                  "The browser did not allow the copy. Select the path and copy it.",
                );
              },
            );
          }}
        >
          Copy the path
        </button>
      </div>
      <p className="fact" role="status">
        {openMessageOf(opened) ?? copied}
      </p>
    </>
  );
}

export function RenderJobRow(props: {
  client: EngineClient;
  job: RenderJob;
  label: string;
  sceneTitleOf: (sceneId: string | undefined) => string | undefined;
  onOpenScene: (target: SceneTarget) => void;
}) {
  const { job } = props;
  const share =
    job.state.kind === "rendering" && job.state.frameCount !== undefined
      ? job.state.framesDone / Math.max(1, job.state.frameCount)
      : undefined;
  return (
    <li className="render-job" data-state={job.state.kind}>
      <div className="render-job-head">
        <span>{props.label}</span>
        <span className="render-job-status">{statusOf(job)}</span>
      </div>
      {job.state.kind === "rendering" ? (
        <div
          className="render-progress"
          role="progressbar"
          aria-label={`Progress of ${props.label}`}
          aria-valuemin={0}
          aria-valuemax={job.state.frameCount ?? 0}
          aria-valuenow={job.state.framesDone}
        >
          <span style={{ width: `${String((share ?? 0) * 100)}%` }} />
        </div>
      ) : undefined}
      {job.state.kind === "done" ? (
        <DoneActions
          client={props.client}
          file={job.state.file}
          fileName={job.state.fileName}
        />
      ) : undefined}
      {job.state.kind === "failed" ? (
        <FailedRender
          message={job.state.message}
          failedAt={job.state.failedAt}
          sceneTitle={props.sceneTitleOf(job.state.failedAt?.sceneId)}
          onOpenScene={(failedAt) => {
            props.onOpenScene({ outputId: job.outputId, ...failedAt });
          }}
        />
      ) : undefined}
    </li>
  );
}
