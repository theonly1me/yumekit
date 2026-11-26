import type { EngineClient } from "../../engine/engineClient.js";
import type { ExportEntry } from "./exportEntry.js";
import { ExportStatus } from "./ExportStatus.js";
import { useExportProgress } from "./useExportProgress.js";

export function ExportLine(props: {
  client: EngineClient;
  entry: ExportEntry;
}) {
  const progress = useExportProgress(props);
  return (
    <li className="entry ai export-line" data-state={props.entry.state}>
      <span className="who">AI</span>
      <div className="answer-body">
        <ExportStatus
          client={props.client}
          entry={props.entry}
          progress={progress}
        />
      </div>
    </li>
  );
}
