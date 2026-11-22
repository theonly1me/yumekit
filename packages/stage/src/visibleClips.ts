import type { SceneClip, TransitionKind } from "@yumekit/project";

export type ClipPart =
  | { kind: "whole" }
  | {
      kind: "leaving" | "entering";
      transition: TransitionKind;
      progress: number;
    };

export interface VisibleClip {
  trackIndex: number;
  clip: SceneClip;
  sceneFrame: number;
  part: ClipPart;
}

function isVisibleAt(options: { clip: SceneClip; frame: number }): boolean {
  const { clip, frame } = options;
  return (
    clip.startFrame <= frame && frame < clip.startFrame + clip.durationFrames
  );
}

function lastSceneFrameOf(clip: SceneClip): number {
  return clip.sceneStartFrame + clip.durationFrames - 1;
}

function transitionFramesOf(options: {
  clip: SceneClip;
  clipBefore: SceneClip;
}): number {
  const { clip, clipBefore } = options;
  const longest = Math.floor(
    Math.min(clip.durationFrames, clipBefore.durationFrames) / 2,
  );
  return Math.min(clip.transition?.durationFrames ?? 0, longest);
}

function clipsOfTrackAt(options: {
  trackIndex: number;
  clips: SceneClip[];
  frame: number;
}): VisibleClip[] {
  const { trackIndex, clips, frame } = options;
  const clip = clips.find((candidate) =>
    isVisibleAt({ clip: candidate, frame }),
  );
  if (clip === undefined) return [];
  const sceneFrame = frame - clip.startFrame + clip.sceneStartFrame;
  const whole: VisibleClip = {
    trackIndex,
    clip,
    sceneFrame,
    part: { kind: "whole" },
  };
  const clipBefore = clips.find(
    (candidate) =>
      candidate.startFrame + candidate.durationFrames === clip.startFrame,
  );
  if (clip.transition === undefined || clipBefore === undefined) {
    return [whole];
  }
  const transitionFrames = transitionFramesOf({ clip, clipBefore });
  const framesIn = frame - clip.startFrame;
  if (framesIn >= transitionFrames) return [whole];
  const progress = (framesIn + 1) / (transitionFrames + 1);
  const transition = clip.transition.kind;
  return [
    {
      trackIndex,
      clip: clipBefore,
      sceneFrame: lastSceneFrameOf(clipBefore),
      part: { kind: "leaving", transition, progress },
    },
    { ...whole, part: { kind: "entering", transition, progress } },
  ];
}

export function visibleClipsAt(options: {
  sceneTracks: SceneClip[][];
  frame: number;
}): VisibleClip[] {
  const { sceneTracks, frame } = options;
  return [...sceneTracks.entries()].flatMap(([trackIndex, clips]) =>
    clipsOfTrackAt({ trackIndex, clips, frame }),
  );
}
