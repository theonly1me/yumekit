import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { useExportSheet } from "../export/useExportSheet.js";
import { useClipTools } from "../makeClip/useClipTools.js";
import { useSoundPartSheet } from "../parts/sound/useSoundPartSheet.js";
import { PlatformTabs } from "../platforms/PlatformTabs.js";
import { Preview } from "../preview/Preview.js";
import { sceneEditsOf } from "../scenes/sceneEdits.js";
import { useDirectChanges } from "../scenes/useDirectChanges.js";
import { useHistory } from "../scenePanel/history/useHistory.js";
import { useSettingsSheet } from "../settings/useSettingsSheet.js";
import { EditorSide } from "./EditorSide.js";
import { LowerArea } from "./LowerArea.js";
import { TopBar } from "./TopBar.js";
import { Transport } from "./Transport.js";
import { useEditorChat } from "./useEditorChat.js";
import { useEditorView } from "./useEditorView.js";
import { useKeyboard } from "./useKeyboard.js";
import { useTheme } from "./useTheme.js";

export function Editor(props: {
  client: EngineClient;
  snapshot: Snapshot;
  projectFolder: string;
}) {
  const { client, snapshot, projectFolder } = props;
  const framesPerSecond = snapshot.project.framesPerSecond;
  const { theme, setTheme } = useTheme();
  const [isTimelineOpen, setTimelineOpen] = useState(false);
  const view = useEditorView({ client, snapshot });
  const editorChat = useEditorChat({ client, view });
  const settings = useSettingsSheet({
    client,
    chat: editorChat.chat,
    projectFolder,
    videoStyle: snapshot.project.videoStyle ?? "graphics",
  });
  const { facts, playback } = view;
  const exporting = useExportSheet({
    client,
    snapshot,
    projectFolder,
    onShowScene: view.showScene,
  });
  const clipTools = useClipTools({
    client,
    snapshot,
    output: facts.output,
    onOpen: playback.pause,
    onAddKey: settings.open,
    onPlaced: view.pickClip,
  });
  const soundPart = useSoundPartSheet({
    client,
    snapshot,
    chat: editorChat.chat,
  });
  const isSheetOpen =
    exporting.isOpen || clipTools.isOpen || settings.isOpen || soundPart.isOpen;
  const openAiSettings = () => {
    playback.pause();
    settings.open(undefined);
  };
  useKeyboard({
    isActive: !isSheetOpen,
    onToggle: playback.toggle,
    onStep: view.step,
  });
  const history = useHistory({ client, isActive: !isSheetOpen });
  const changes = useDirectChanges(client);
  const edits = sceneEditsOf({ changes, onPicked: view.setPicked });
  const { output, tab } = facts;

  if (output === undefined || tab === undefined) {
    return (
      <main className="state">
        <h1>This project has no video shape yet</h1>
        <p>Ask your agent to add a platform, for example YouTube.</p>
      </main>
    );
  }
  return (
    <div className="editor">
      <div className="editor-grid" inert={isSheetOpen}>
        <TopBar
          projectName={snapshot.project.name}
          theme={theme}
          onTheme={setTheme}
          exportLabel={exporting.label}
          onSettings={openAiSettings}
          onExport={() => {
            playback.pause();
            exporting.open();
          }}
        />
        <main className="stage">
          <div className="preview">
            <PlatformTabs
              tabs={facts.tabs}
              activeKey={tab.key}
              outputs={snapshot.project.outputs}
              failure={changes.failureOf("platforms")}
              onTab={view.chooseTab}
              onAdd={(platformId) => {
                view.chooseTab(`platform:${platformId}`);
                changes
                  .run({
                    area: "platforms",
                    name: "add_platform",
                    input: { platform_id: platformId },
                  })
                  .catch(() => undefined);
              }}
              onRemove={(platformId) => {
                changes
                  .run({
                    area: "platforms",
                    name: "remove_platform",
                    input: { platform_id: platformId },
                  })
                  .catch(() => undefined);
              }}
            />
            <Preview
              client={client}
              output={output}
              frame={facts.frame}
              framesPerSecond={framesPerSecond}
              hint={`${tab.name}, ${String(output.widthPixels)} x ${String(output.heightPixels)}.`}
            />
            <Transport
              frame={facts.frame}
              frameCount={facts.lengthFrames}
              framesPerSecond={framesPerSecond}
              isPlaying={playback.isPlaying}
              onToggle={playback.toggle}
              onScrub={view.moveTo}
            />
          </div>
          <LowerArea
            client={client}
            snapshot={snapshot}
            output={output}
            timeline={facts.timeline}
            mainClips={facts.mainClips}
            lengthFrames={facts.lengthFrames}
            frame={facts.frame}
            picked={view.pickedCard}
            shownClipId={facts.shownClipId}
            selectedClipId={facts.selectedClipId}
            changes={changes}
            edits={edits}
            isTimelineOpen={isTimelineOpen}
            onTimelineOpen={setTimelineOpen}
            editorChat={editorChat}
            onPickCard={(clip) => {
              editorChat.box.removeChip(undefined);
              view.toggleCard(clip);
            }}
            onPick={view.pickClip}
            onSeek={view.moveTo}
            onEditText={view.editText}
            onMakeClip={clipTools.open}
            onOpenSound={(part) => {
              playback.pause();
              soundPart.open(part);
            }}
          />
        </main>
        <EditorSide
          client={client}
          snapshot={snapshot}
          view={view}
          editorChat={editorChat}
          history={history}
          pictureGroupFor={clipTools.entryFor}
          onLength={edits.resize}
          onOpenAiSettings={openAiSettings}
        />
        <button
          type="button"
          className="primary ask-jump"
          onClick={editorChat.focusBox}
        >
          Ask for a change
        </button>
      </div>
      {exporting.sheet}
      {clipTools.sheet}
      {settings.sheet}
      {soundPart.sheet}
    </div>
  );
}
