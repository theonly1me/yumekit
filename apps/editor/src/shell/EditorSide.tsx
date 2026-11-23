import type { ReactNode } from "react";
import { ChatPanel } from "../chat/ChatPanel.js";
import type { EngineClient } from "../engine/engineClient.js";
import type { Scene, SceneClip, Snapshot } from "../engine/snapshot.js";
import type { History } from "../scenePanel/history/useHistory.js";
import { ScenePanel } from "../scenePanel/ScenePanel.js";
import type { SceneEdits } from "../scenes/sceneEdits.js";
import { SidePanel } from "../side/SidePanel.js";
import type { EditorChat } from "./useEditorChat.js";
import type { EditorView } from "./useEditorView.js";

export function EditorSide(props: {
  client: EngineClient;
  snapshot: Snapshot;
  view: EditorView;
  editorChat: EditorChat;
  history: History;
  pictureGroupFor: (target: { scene: Scene; clip: SceneClip }) => ReactNode;
  onLength: SceneEdits["resize"];
  onOpenAiSettings: () => void;
}) {
  const { client, snapshot, view, editorChat } = props;
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
      isOpen={view.isSideOpen}
      onClose={view.closeSide}
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
      ) : undefined}
      <ChatPanel
        chat={editorChat.chat}
        box={editorChat.box}
        chip={editorChat.chip}
        hasScenes={view.facts.mainClips.length > 0}
        isHidden={isScene}
        sceneNumberOf={editorChat.sceneNumberOf}
        onOpenAiSettings={props.onOpenAiSettings}
      />
    </SidePanel>
  );
}
