import { useCallback, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { SceneClip, Snapshot } from "../engine/snapshot.js";
import type { SceneToShow } from "../export/useExportSheet.js";
import { usePlayback } from "../preview/usePlayback.js";
import { useSound } from "../preview/useSound.js";
import type { PickedCard } from "../scenes/SceneActions.js";
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
  const [pickedClipId, setPickedClipId] = useState<string>();
  const [sideTab, setSideTab] = useState<SideTab>("chat");
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
    pickClip(clip);
  };
  const { pickedClip, pickedScene, pickedNumber } = facts;
  const pickedCard: PickedCard | undefined =
    pickedClip === undefined || pickedNumber === undefined
      ? undefined
      : {
          clip: pickedClip,
          number: pickedNumber,
          title: pickedScene?.title ?? pickedClip.sceneId,
        };

  return {
    facts,
    playback,
    moveTo,
    step,
    pickClip,
    setPicked,
    toggleCard,
    pickedCard,
    sideTab,
    setSideTab,
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
      setSideTab("scene");
      setFocusRequest((current) => current + 1);
    },
    showScene: (scene: SceneToShow) => {
      const tab = platformTabsOf(snapshot.project.outputs).find(
        (candidate) => candidate.output.id === scene.outputId,
      );
      setTabKey(tab?.key);
      setPickedClipId(scene.clipId);
      setFrame(scene.frame);
      setSideTab("scene");
    },
  };
}
