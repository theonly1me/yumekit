import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output, Scene, SceneClip, Snapshot } from "../engine/snapshot.js";
import { ToolsPane } from "../tools/ToolsPane.js";
import { MakeClipEntry } from "./MakeClipEntry.js";
import { MakeClipSheet } from "./MakeClipSheet.js";

export function useClipTools(options: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output | undefined;
  onOpen: () => void;
  onToolsTab: () => void;
  onPlaced: (clip: { id: string; startFrame: number }) => void;
}) {
  const { client, snapshot, output } = options;
  const [clipFor, setClipFor] = useState<SceneClip>();
  const [toolsServerId, setToolsServerId] = useState<string>();

  const toolsPane = (
    <ToolsPane
      client={client}
      openServerId={toolsServerId}
      onOpenServer={setToolsServerId}
    />
  );

  const entryFor = ({
    scene,
    clip,
  }: {
    scene: Scene | undefined;
    clip: SceneClip | undefined;
  }) =>
    scene === undefined || clip === undefined ? undefined : (
      <MakeClipEntry
        scene={scene}
        onOpen={() => {
          options.onOpen();
          setClipFor(clip);
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
        onAddKey={(serverId) => {
          setClipFor(undefined);
          setToolsServerId(serverId);
          options.onToolsTab();
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

  return { toolsPane, entryFor, sheet, isOpen: sheet !== undefined };
}
