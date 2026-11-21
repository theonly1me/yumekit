import { useEffect, useRef, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { outputLabel } from "../timeline/timelineFacts.js";
import { RenderJobRow } from "./RenderJobRow.js";
import { outputFactsOf } from "./renderJobs.js";
import type { Renders } from "./useRenders.js";
import "./render.css";

function filesWord(count: number): string {
  return count === 1 ? "1 file" : `${String(count)} files`;
}

function rendersFolderOf(projectFolder: string): string {
  const separator = projectFolder.includes("\\") ? "\\" : "/";
  return `${projectFolder.replace(/[\\/]+$/, "")}${separator}renders`;
}

export function RenderSheet(props: {
  client: EngineClient;
  snapshot: Snapshot;
  projectFolder: string;
  renders: Renders;
  onClose: () => void;
}) {
  const { client, snapshot, renders } = props;
  const closeButton = useRef<HTMLButtonElement>(null);
  const outputs = snapshot.project.outputs.map((output) => ({
    output,
    ...outputFactsOf({ snapshot, output }),
  }));
  const [chosen, setChosen] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        renders.jobs.length > 0
          ? renders.jobs.map((job) => job.outputId)
          : outputs
              .filter((entry) => entry.lengthFrames > 0)
              .map((entry) => entry.output.id),
      ),
  );
  const chosenIds = outputs
    .filter((entry) => entry.lengthFrames > 0 && chosen.has(entry.output.id))
    .map((entry) => entry.output.id);
  const rendersFolder = rendersFolderOf(props.projectFolder);
  const runningCount = renders.jobs.length;

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  return (
    <div
      className="sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="render-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") props.onClose();
      }}
    >
      <button
        ref={closeButton}
        type="button"
        className="tab sheet-close"
        onClick={props.onClose}
      >
        Close
      </button>
      <form
        className="sheet-body"
        onSubmit={(event) => {
          event.preventDefault();
          renders.start(chosenIds);
        }}
      >
        <h2 id="render-title">Render</h2>
        <fieldset disabled={renders.isRunning}>
          <legend>Files to make</legend>
          {outputs.map((entry) => (
            <label key={entry.output.id}>
              <input
                type="checkbox"
                checked={entry.lengthFrames > 0 && chosen.has(entry.output.id)}
                disabled={entry.lengthFrames === 0}
                onChange={(event) => {
                  const next = new Set(chosen);
                  if (event.target.checked) next.add(entry.output.id);
                  else next.delete(entry.output.id);
                  setChosen(next);
                }}
              />
              {entry.description}
            </label>
          ))}
        </fieldset>
        <dl className="render-facts">
          <div>
            <dt>Cost</dt>
            <dd>$0.00, it runs on this computer</dd>
          </div>
          <div>
            <dt>Saved to</dt>
            <dd>{rendersFolder}</dd>
          </div>
        </dl>
        <button
          type="submit"
          className="primary"
          disabled={renders.isRunning || chosenIds.length === 0}
        >
          {renders.isRunning
            ? `Rendering ${filesWord(runningCount)}`
            : `Render ${filesWord(chosenIds.length)}`}
        </button>
        {renders.jobs.length === 0 ? undefined : (
          <ol className="render-jobs" aria-label="Renders">
            {renders.jobs.map((job) => {
              const output = snapshot.project.outputs.find(
                (candidate) => candidate.id === job.outputId,
              );
              return (
                <RenderJobRow
                  key={job.callId}
                  client={client}
                  job={job}
                  label={
                    output === undefined ? job.outputId : outputLabel(output)
                  }
                />
              );
            })}
          </ol>
        )}
      </form>
    </div>
  );
}
