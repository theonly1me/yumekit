import { useMemo } from "react";
import type { Snapshot } from "../engine/snapshot.js";
import { platformTabsOf } from "../platforms/platformTabFacts.js";
import {
  audibleClipsOf,
  clipAt,
  lengthFramesOf,
  mainSceneClipsOf,
  timelineOf,
} from "../timeline/timelineFacts.js";

export function useEditorFacts(options: {
  snapshot: Snapshot;
  tabKey: string | undefined;
  wantedFrame: number;
  pickedClipId: string | undefined;
}) {
  const { snapshot, tabKey, wantedFrame, pickedClipId } = options;
  const tabs = useMemo(
    () => platformTabsOf(snapshot.project.outputs),
    [snapshot.project.outputs],
  );
  const tab = tabs.find((candidate) => candidate.key === tabKey) ?? tabs[0];
  const output = tab?.output;
  const outputId = output?.id ?? "";

  const timelineFacts = useMemo(() => {
    const timeline = timelineOf({ snapshot, outputId });
    return {
      timeline,
      lengthFrames: lengthFramesOf(timeline),
      mainClips: mainSceneClipsOf({ timeline, scenes: snapshot.scenes }),
      audioClips: audibleClipsOf(timeline),
      sceneClips: timeline.tracks.flatMap((track) =>
        track.kind === "scene" ? track.clips : [],
      ),
    };
  }, [snapshot, outputId]);

  const { lengthFrames, mainClips, sceneClips } = timelineFacts;
  const frame = Math.min(wantedFrame, Math.max(0, lengthFrames - 1));
  const shownClipId = clipAt({ clips: mainClips, frame })?.id;
  const pickedClip = sceneClips.find((clip) => clip.id === pickedClipId);
  const pickedIndex = mainClips.findIndex((clip) => clip.id === pickedClipId);
  const pickedScene = snapshot.scenes.find(
    (candidate) => candidate.id === pickedClip?.sceneId,
  );

  return {
    ...timelineFacts,
    tabs,
    tab,
    output,
    frame,
    shownClipId,
    selectedClipId: pickedClip?.id ?? shownClipId,
    pickedClip,
    pickedScene,
    pickedNumber: pickedIndex < 0 ? undefined : pickedIndex + 1,
  };
}
