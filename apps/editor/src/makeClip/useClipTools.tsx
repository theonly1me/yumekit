import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output, Scene, SceneClip, Snapshot } from "../engine/snapshot.js";
import { MakeClipEntry } from "./MakeClipEntry.js";
import { MakeClipSheet } from "./MakeClipSheet.js";

export function useClipTools(options: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output | undefined;
  onOpen: () => void;
  onPlaced: (clip: { id: string; startFrame: number }) => void;
}) {
  const { client, snapshot, output } = options;
  const [clipFor, setClipFor] = useState<SceneClip>();

  const open = (clip: SceneClip) => {
    options.onOpen();
    setClipFor(clip);
  };

  const entryFor = (target: { scene: Scene; clip: SceneClip }) => (
    <MakeClipEntry
      scene={target.scene}
      onOpen={() => {
        open(target.clip);
      }}
    />
  );

  const sheet =
    clipFor === undefined || output === undefined ? undefined : (
      <MakeClipSheet
        client={client}
        snapshot={snapshot}
        output={output}
        clip={clipFor}
        onClose={() => {
          setClipFor(undefined);
        }}
        onPlaced={(made) => {
          setClipFor(undefined);
          options.onPlaced({
            id: made.sceneClipId,
            startFrame: made.startFrame,
          });
        }}
      />
    );

  return { open, entryFor, sheet, isOpen: sheet !== undefined };
}
