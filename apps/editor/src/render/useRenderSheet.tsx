import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { clipOfTarget, renderButtonLabel } from "./renderJobs.js";
import { RenderSheet } from "./RenderSheet.js";
import { useRenders } from "./useRenders.js";

export interface SceneToShow {
  outputId: string;
  clipId: string | undefined;
  frame: number;
}

export function useRenderSheet(options: {
  client: EngineClient;
  snapshot: Snapshot;
  projectFolder: string;
  onShowScene: (scene: SceneToShow) => void;
}) {
  const { client, snapshot } = options;
  const [isOpen, setOpen] = useState(false);
  const renders = useRenders(client);
  const sheet = isOpen ? (
    <RenderSheet
      client={client}
      snapshot={snapshot}
      projectFolder={options.projectFolder}
      renders={renders}
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
    label: renderButtonLabel(renders),
    sheet,
  };
}
