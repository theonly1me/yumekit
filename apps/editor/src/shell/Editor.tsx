import { useCallback, useMemo, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { SceneClip, Snapshot } from "../engine/snapshot.js";
import { Preview } from "../preview/Preview.js";
import { usePlayback } from "../preview/usePlayback.js";
import { useSound } from "../preview/useSound.js";
import { AgentPane } from "../side/AgentPane.js";
import { ScenePane } from "../side/ScenePane.js";
import { SidePanel, type SideTab } from "../side/SidePanel.js";
import { useClipTools } from "../makeClip/useClipTools.js";
import { useEditorFacts } from "./useEditorFacts.js";
import { LowerArea, type LowerView } from "./LowerArea.js";
import { RenderSheet } from "./RenderSheet.js";
import { TopBar } from "./TopBar.js";
import { Transport } from "./Transport.js";
import { useKeyboard } from "./useKeyboard.js";
import { useTheme } from "./useTheme.js";

export function Editor(props: {
  client: EngineClient;
  snapshot: Snapshot;
  projectFolder: string;
}) {
  const { client, snapshot } = props;
  const framesPerSecond = snapshot.project.framesPerSecond;
  const [chosenOutputId, setOutputId] = useState<string>();
  const [wantedFrame, setFrame] = useState(0);
  const [pickedClipId, setPickedClipId] = useState<string>();
  const [sideTab, setSideTab] = useState<SideTab>("agent");
  const [lowerView, setLowerView] = useState<LowerView>("scenes");
  const [isRenderOpen, setRenderOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const facts = useEditorFacts({
    snapshot,
    chosenOutputId,
    wantedFrame,
    pickedClipId,
  });
  const { output, frame, lengthFrames } = facts;
  const playback = usePlayback({
    frame,
    frameCount: lengthFrames,
    framesPerSecond,
    setFrame,
  });
  useSound({
    client,
    clips: facts.audioClips,
    framesPerSecond,
    run: playback.run,
  });
  const { pause } = playback;

  const moveTo = useCallback(
    (next: number) => {
      pause();
      setFrame(Math.min(Math.max(0, next), Math.max(0, lengthFrames - 1)));
    },
    [pause, lengthFrames],
  );
  const step = useCallback(
    (frames: number) => {
      moveTo(frame + frames);
    },
    [moveTo, frame],
  );
  const pickClip = (clip: { id: string; startFrame: number }) => {
    setPickedClipId(clip.id);
    moveTo(clip.startFrame);
  };
  const pickScene = (clip: SceneClip) => {
    pickClip(clip);
    setSideTab("scene");
  };
  const clipTools = useClipTools({
    client,
    snapshot,
    output,
    onOpen: pause,
    onToolsTab: () => {
      setSideTab("tools");
    },
    onPlaced: pickClip,
  });
  useKeyboard({
    isActive: !isRenderOpen && !clipTools.isOpen,
    onToggle: playback.toggle,
    onStep: step,
  });
  const sidePane = useMemo(() => {
    if (sideTab === "agent") {
      return <AgentPane projectFolder={props.projectFolder} />;
    }
    if (sideTab === "tools") return clipTools.toolsPane;
    return (
      <>
        <ScenePane
          clip={facts.sceneClip}
          scene={facts.scene}
          framesPerSecond={framesPerSecond}
        />
        {clipTools.entryFor({ scene: facts.scene, clip: facts.sceneClip })}
      </>
    );
  }, [
    sideTab,
    props.projectFolder,
    clipTools,
    facts.sceneClip,
    facts.scene,
    framesPerSecond,
  ]);

  if (output === undefined) {
    return (
      <main className="state">
        <h1>This project has no output</h1>
        <p>Ask your agent to add an output, for example a wide video.</p>
      </main>
    );
  }
  return (
    <div className="editor" data-view={lowerView}>
      <TopBar
        projectName={snapshot.project.name}
        outputs={snapshot.project.outputs}
        outputId={output.id}
        theme={theme}
        onOutput={(outputId) => {
          pause();
          setOutputId(outputId);
        }}
        onTheme={setTheme}
        onRender={() => {
          pause();
          setRenderOpen(true);
        }}
      />
      <main className="center">
        <Preview client={client} output={output} frame={frame} />
        <Transport
          frame={frame}
          frameCount={lengthFrames}
          framesPerSecond={framesPerSecond}
          isPlaying={playback.isPlaying}
          onToggle={playback.toggle}
          onScrub={moveTo}
        />
        <LowerArea
          client={client}
          snapshot={snapshot}
          output={output}
          timeline={facts.timeline}
          mainClips={facts.mainClips}
          lengthFrames={lengthFrames}
          frame={frame}
          selectedClipId={facts.selectedClipId}
          view={lowerView}
          onView={setLowerView}
          onPick={pickClip}
          onPickScene={pickScene}
          onSeek={moveTo}
        />
      </main>
      <SidePanel tab={sideTab} onTab={setSideTab}>
        {sidePane}
      </SidePanel>
      {isRenderOpen ? (
        <RenderSheet
          projectFolder={props.projectFolder}
          outputId={output.id}
          onClose={() => {
            setRenderOpen(false);
          }}
        />
      ) : undefined}
      {clipTools.sheet}
    </div>
  );
}
