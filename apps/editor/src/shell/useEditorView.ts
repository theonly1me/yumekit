import { useCallback, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { SceneClip, Snapshot } from "../engine/snapshot.js";
import { sceneNameById } from "../names/index.js";
import type { SceneToShow } from "../export/useExportSheet.js";
import { usePlayback } from "../preview/usePlayback.js";
import { useSound } from "../preview/useSound.js";
import type { PickedCard } from "../scenes/SceneActions.js";
import { stillFrameOf } from "../scenes/useSceneStills.js";
import type { SideTab } from "../side/SidePanel.js";
import { platformTabsOf } from "../platforms/platformTabFacts.js";
import { useEditorFacts } from "./useEditorFacts.js";

export type EditorView = ReturnType<typeof useEditorView>;

export function useEditorView(options: {
  client: EngineClient;
  snapshot: Snapshot;
}) {
  const { client, snapshot } = options;
  const framesPerSecond = snapshot.project.framesPerSecond;
  const [tabKey, setTabKey] = useState<string>();
  const [wantedFrame, setFrame] = useState(0);
  const [hasMoved, setMoved] = useState(false);
  const [pickedClipId, setPickedClipId] = useState<string>();
  const [sideTab, setSideTab] = useState<SideTab>("chat");
  const [isSideOpen, setSideOpen] = useState(false);
  const openSide = (tab: SideTab) => {
    setSideTab(tab);
    setSideOpen(true);
  };
  const [focusRequest, setFocusRequest] = useState(0);
  const facts = useEditorFacts({ snapshot, tabKey, wantedFrame, pickedClipId });
  const { frame, lengthFrames } = facts;
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
      setMoved(true);
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
  const setPicked = (clipId: string | undefined) => {
    setPickedClipId(clipId);
    if (clipId === undefined) setSideTab("chat");
  };
  const toggleCard = (clip: SceneClip) => {
    if (clip.id === pickedClipId) {
      setPicked(undefined);
      return;
    }
    setPickedClipId(clip.id);
    moveTo(stillFrameOf(clip));
  };
  const { pickedClip, pickedScene, pickedNumber } = facts;
  const pickedCard: PickedCard | undefined =
    pickedClip === undefined || pickedNumber === undefined
      ? undefined
      : {
          clip: pickedClip,
          number: pickedNumber,
          title: sceneNameById({
            sceneId: pickedClip.sceneId,
            scenes: snapshot.scenes,
            assets: snapshot.assets,
          }),
        };

  const [firstClip] = facts.mainClips;
  const isOpening = !hasMoved && !playback.isPlaying && frame === 0;

  return {
    facts,
    previewFrame:
      isOpening && firstClip !== undefined ? stillFrameOf(firstClip) : frame,
    playback,
    moveTo,
    step,
    pickClip,
    setPicked,
    toggleCard,
    pickedCard,
    sideTab,
    setSideTab: openSide,
    isSideOpen,
    closeSide: () => {
      setSideOpen(false);
    },
    focusRequest,
    sceneLabel:
      pickedScene === undefined
        ? undefined
        : pickedNumber === undefined
          ? "Scene"
          : `Scene ${String(pickedNumber)}`,
    chooseTab: (key: string) => {
      pause();
      setTabKey(key);
    },
    editText: () => {
      openSide("scene");
      setFocusRequest((current) => current + 1);
    },
    showScene: (scene: SceneToShow) => {
      const tab = platformTabsOf(snapshot.project.outputs).find(
        (candidate) => candidate.output.id === scene.outputId,
      );
      setTabKey(tab?.key);
      setPickedClipId(scene.clipId);
      setMoved(true);
      setFrame(scene.frame);
      openSide("scene");
    },
  };
}
