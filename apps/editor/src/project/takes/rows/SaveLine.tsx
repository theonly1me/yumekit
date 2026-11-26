import type { SaveState } from "../review/useTakeReview.js";
import "./reviewControls.css";

export function SaveLine(props: {
  save: SaveState | undefined;
  onSaveAgain: () => void;
}) {
  const { save } = props;
  if (save?.kind === "failed") {
    return (
      <p className="save-line" data-failed="true" role="alert">
        Not saved: {save.message}{" "}
        <button type="button" className="link" onClick={props.onSaveAgain}>
          Save again
        </button>
      </p>
    );
  }
  const words =
    save === undefined
      ? "Saves as you type."
      : save.kind === "saved"
        ? "Saved"
        : "Saving";
  return (
    <p className="save-line" aria-live="polite">
      {words}
    </p>
  );
}
