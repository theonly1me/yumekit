import { useMemo } from "react";
import type { SceneClip, Snapshot } from "../engine/snapshot.js";
import {
  audibleClipsOf,
  clipAt,
  lengthFramesOf,
  mainSceneClipsOf,
  timelineOf,
} from "../timeline/timelineFacts.js";

export function useEditorFacts(options: {
  snapshot: Snapshot;
  chosenOutputId: string | undefined;
  wantedFrame: number;
  pickedClipId: string | undefined;
}) {
  const { snapshot, chosenOutputId, wantedFrame, pickedClipId } = options;
  const { outputs } = snapshot.project;
  const output =
    outputs.find((candidate) => candidate.id === chosenOutputId) ?? outputs[0];
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
      allClips: timeline.tracks.flatMap((track) =>
        track.clips.map(({ id, startFrame, durationFrames }) => ({
          id,
          startFrame,
          durationFrames,
        })),
      ),
    };
  }, [snapshot, outputId]);

  const { lengthFrames, mainClips, sceneClips, allClips } = timelineFacts;
  const frame = Math.min(wantedFrame, Math.max(0, lengthFrames - 1));
  const picked = allClips.find((clip) => clip.id === pickedClipId);
  const isPickedVisible =
    picked !== undefined &&
    frame >= picked.startFrame &&
    frame < picked.startFrame + picked.durationFrames;
  const mainClip = clipAt({ clips: mainClips, frame });
  const selectedClipId = isPickedVisible ? picked.id : mainClip?.id;
  const pickedSceneClip: SceneClip | undefined = isPickedVisible
    ? sceneClips.find((clip) => clip.id === picked.id)
    : undefined;
  const sceneClip = pickedSceneClip ?? mainClip;
  const scene = snapshot.scenes.find(
    (candidate) => candidate.id === sceneClip?.sceneId,
  );

  return {
    ...timelineFacts,
    output,
    frame,
    selectedClipId,
    sceneClip,
    scene,
  };
}
