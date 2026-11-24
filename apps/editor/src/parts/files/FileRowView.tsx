import type { EngineClient } from "../../engine/engineClient.js";
import type { FileRow } from "./fileFacts.js";
import { FileThumb } from "./FileThumb.js";

export interface FileRowActions {
  isOff: boolean;
  isWorking: boolean;
  onDownload: (row: FileRow) => void;
  onRemove: (row: FileRow) => void;
  onUse: (row: FileRow) => void;
  onUseFont: (row: FileRow) => void;
}

function requestNameOf(row: FileRow): string {
  return row.asset.source.kind === "import" ? row.name : row.asset.id;
}

export function FileRowView(props: {
  client: EngineClient;
  row: FileRow;
  actions: FileRowActions;
}) {
  const { row, actions } = props;
  const isUsed = row.uses.length > 0;
  const facts = [row.sizeText, row.madeBy].filter((fact) => fact !== "");
  return (
    <li className="file-row" data-used={isUsed}>
      <FileThumb client={props.client} row={row} />
      <div className="file-text">
        <span className="file-name" title={row.name}>
          {row.name}
        </span>
        <span className="fact">{facts.join(" · ")}</span>
        <span className="file-use" data-used={isUsed}>
          {isUsed ? `In the video: ${row.uses.join(", ")}` : "Not in the video"}
        </span>
      </div>
      <div className="file-actions">
        {row.asset.kind !== "font" || row.isVideoFont ? undefined : (
          <button
            type="button"
            aria-label={`Use ${row.name} as the font of the video`}
            disabled={actions.isOff}
            onClick={() => {
              actions.onUseFont(row);
            }}
          >
            Use as the font
          </button>
        )}
        {isUsed || row.asset.kind === "font" ? undefined : (
          <button
            type="button"
            aria-label={`Use ${row.name} in the video`}
            disabled={actions.isOff}
            onClick={() => {
              actions.onUse({ ...row, name: requestNameOf(row) });
            }}
          >
            Use in the video
          </button>
        )}
        <button
          type="button"
          aria-label={`Download ${row.name}`}
          disabled={actions.isWorking}
          onClick={() => {
            actions.onDownload(row);
          }}
        >
          Download
        </button>
        <button
          type="button"
          aria-label={`Remove ${row.name}`}
          title={
            isUsed
              ? `The video uses this file in ${row.uses.join(", ")}.`
              : undefined
          }
          disabled={isUsed || actions.isOff || actions.isWorking}
          onClick={() => {
            actions.onRemove(row);
          }}
        >
          Remove
        </button>
      </div>
    </li>
  );
}
