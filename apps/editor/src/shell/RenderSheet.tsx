import { useEffect, useRef } from "react";
import { shellQuoted } from "../side/agentClients.js";
import { CopyBlock } from "../side/CopyBlock.js";

export function RenderSheet(props: {
  projectFolder: string;
  outputId: string;
  onClose: () => void;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);

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
      <div className="sheet-body">
        <h2 id="render-title">Render</h2>
        <p className="fact">
          Render in the editor arrives in a later step. Until then, run this
          command in a terminal. It writes the video to the renders folder of
          the project.
        </p>
        <CopyBlock
          text={`yumekit render --project ${shellQuoted(props.projectFolder)} --output ${shellQuoted(props.outputId)}`}
          copyLabel="Copy the command"
        />
      </div>
    </div>
  );
}
