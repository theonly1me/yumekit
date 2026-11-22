import type { ScriptStatus } from "./useScriptSaves.js";

function messageOf(status: ScriptStatus): string {
  switch (status.kind) {
    case "same":
      return "";
    case "changed":
      return "You changed the script. The video still follows the old script.";
    case "asked":
      return "The AI updates the video to match the script.";
    case "failed":
      return `The script did not save: ${status.message}`;
    case "refused":
      return status.message;
  }
}

export function ScriptStatusLine(props: {
  status: ScriptStatus;
  locked: boolean;
  onUpdate: () => void;
  onUndo: () => void;
}) {
  const { status } = props;
  return (
    <div className="script-status" data-status={status.kind} aria-live="polite">
      <p>{messageOf(status)}</p>
      {status.kind === "changed" || status.kind === "refused" ? (
        <>
          <button
            type="button"
            className="primary"
            disabled={props.locked}
            onClick={props.onUpdate}
          >
            Update the video
          </button>
          <button type="button" disabled={props.locked} onClick={props.onUndo}>
            Undo my changes
          </button>
        </>
      ) : undefined}
    </div>
  );
}
