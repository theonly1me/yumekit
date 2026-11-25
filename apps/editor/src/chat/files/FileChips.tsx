import { useId } from "react";
import { acceptedFiles, thumbLabels, type PendingFile } from "./pendingFile.js";
import "./files.css";

function stateLineOf(file: PendingFile): string | undefined {
  if (file.state.kind === "adding") return "Adding";
  return file.state.kind === "failed" ? file.state.message : undefined;
}

export function FileChips(props: {
  files: PendingFile[];
  onRemove: (id: string) => void;
}) {
  if (props.files.length === 0) return undefined;
  return (
    <ul className="file-chips" aria-label="Files for the AI">
      {props.files.map((file) => {
        const stateLine = stateLineOf(file);
        return (
          <li key={file.id} className="file-chip" data-state={file.state.kind}>
            <span
              className="file-thumb"
              data-kind={file.kind}
              style={
                file.previewUrl === undefined
                  ? undefined
                  : { backgroundImage: `url("${file.previewUrl}")` }
              }
            >
              {file.previewUrl === undefined ? thumbLabels[file.kind] : ""}
            </span>
            <span className="file-words">
              <span className="file-name">{file.file.name}</span>
              {stateLine === undefined ? undefined : (
                <span
                  className="file-state"
                  role={file.state.kind === "failed" ? "alert" : undefined}
                >
                  {stateLine}
                </span>
              )}
            </span>
            <button
              type="button"
              className="remove"
              aria-label={`Remove ${file.file.name}`}
              disabled={file.state.kind === "adding"}
              onClick={() => {
                props.onRemove(file.id);
              }}
            >
              Remove
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function AddFilesButton(props: { onFiles: (files: File[]) => void }) {
  const inputId = useId();
  return (
    <label className="add-files" htmlFor={inputId}>
      Add files
      <input
        id={inputId}
        type="file"
        multiple
        accept={acceptedFiles}
        onChange={(event) => {
          const input = event.currentTarget;
          props.onFiles([...(input.files ?? [])]);
          input.value = "";
        }}
      />
    </label>
  );
}

export function DropHint(props: { isShown: boolean }) {
  return (
    <p className="drop-hint" aria-hidden="true" data-shown={props.isShown}>
      Drop the files for the AI
    </p>
  );
}
