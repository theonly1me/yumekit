import { useState } from "react";
import type { ChatEntry } from "../chat/chatSchemas.js";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { clipOfTarget, exportButtonLabel } from "./exportJobs.js";
import { ExportSheet } from "./ExportSheet.js";
import { useExports } from "./useExports.js";

export interface SceneToShow {
  outputId: string;
  clipId: string | undefined;
  frame: number;
}

export function useExportSheet(options: {
  client: EngineClient;
  snapshot: Snapshot;
  projectFolder: string;
  entries: readonly ChatEntry[];
  onShowScene: (scene: SceneToShow) => void;
}) {
  const { client, snapshot } = options;
  const [isOpen, setOpen] = useState(false);
  const exports = useExports({ client, entries: options.entries });
  const sheet = isOpen ? (
    <ExportSheet
      client={client}
      snapshot={snapshot}
      projectFolder={options.projectFolder}
      exports={exports}
      onOpenScene={(target) => {
        const clip = clipOfTarget({ snapshot, target });
        setOpen(false);
        options.onShowScene({
          outputId: target.outputId,
          clipId: clip?.id,
          frame: target.frame ?? clip?.startFrame ?? 0,
        });
      }}
      onClose={() => {
        setOpen(false);
      }}
    />
  ) : undefined;
  return {
    isOpen,
    open: () => {
      setOpen(true);
    },
    label: exportButtonLabel(exports),
    exports,
    sheet,
  };
}
