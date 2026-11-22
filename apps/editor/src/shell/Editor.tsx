import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { useExportSheet } from "../export/useExportSheet.js";
import { useClipTools } from "../makeClip/useClipTools.js";
import type { StepViewId } from "../parts/frame/stepViewProps.js";
import { useStepSheet } from "../parts/frame/useStepSheet.js";
import { ProjectPlatformTabs } from "../platforms/ProjectPlatformTabs.js";
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
    snapshot,
    projectFolder,
    videoStyle: snapshot.project.videoStyle ?? "graphics",
    look: snapshot.project.look ?? "paper",
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
  const stepSheet = useStepSheet({
    client,
    snapshot,
    chat: editorChat.chat,
    onSideTab: view.setSideTab,
  });
  const openStepView = (stepId: StepViewId) => {
    playback.pause();
    stepSheet.open(stepId);
  };
  const isSheetOpen = [exporting, clipTools, settings, stepSheet].some(
    (sheet) => sheet.isOpen,
  );
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
          onStepView={openStepView}
          onSettings={openAiSettings}
          onExport={() => {
            playback.pause();
            exporting.open();
          }}
        />
        <main className="stage">
          <div className="preview">
            <ProjectPlatformTabs
              tabs={facts.tabs}
              activeKey={tab.key}
              outputs={snapshot.project.outputs}
              changes={changes}
              onTab={view.chooseTab}
            />
            <Preview
              client={client}
              output={output}
              frame={facts.frame}
              framesPerSecond={framesPerSecond}
              hint={`Click the text in the video to change it. ${tab.name}, ${String(output.widthPixels)} x ${String(output.heightPixels)}.`}
              snapshot={snapshot}
              onTextEditing={playback.pause}
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
            onOpenSound={openStepView}
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
      {stepSheet.sheet}
    </div>
  );
}
