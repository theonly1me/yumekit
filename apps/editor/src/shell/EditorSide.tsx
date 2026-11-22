import type { ReactNode } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Scene, SceneClip, Snapshot } from "../engine/snapshot.js";
import type { History } from "../scenePanel/history/useHistory.js";
import { ScenePanel } from "../scenePanel/ScenePanel.js";
import type { SceneEdits } from "../scenes/sceneEdits.js";
import { ChatPane } from "../side/ChatPane.js";
import { SidePanel } from "../side/SidePanel.js";
import type { EditorView } from "./useEditorView.js";

export function EditorSide(props: {
  client: EngineClient;
  snapshot: Snapshot;
  projectFolder: string;
  view: EditorView;
  history: History;
  pictureGroupFor: (target: { scene: Scene; clip: SceneClip }) => ReactNode;
  onLength: SceneEdits["resize"];
}) {
  const { client, snapshot, view } = props;
  const { pickedClip, pickedScene } = view.facts;
  const isScene =
    view.sideTab === "scene" &&
    pickedClip !== undefined &&
    pickedScene !== undefined;
  return (
    <SidePanel
      tab={view.sideTab}
      sceneLabel={view.sceneLabel}
      onTab={view.setSideTab}
    >
      {isScene ? (
        <ScenePanel
          client={client}
          snapshot={snapshot}
          clip={pickedClip}
          scene={pickedScene}
          history={props.history}
          focusRequest={view.focusRequest}
          pictureGroup={props.pictureGroupFor({
            scene: pickedScene,
            clip: pickedClip,
          })}
          onLength={(durationFrames) => {
            props.onLength({ clip: pickedClip, durationFrames });
          }}
        />
      ) : (
        <ChatPane client={client} projectFolder={props.projectFolder} />
      )}
    </SidePanel>
  );
}
