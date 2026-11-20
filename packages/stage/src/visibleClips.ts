import type { SceneClip } from "@yumekit/project";

export interface VisibleClip {
  trackIndex: number;
  clip: SceneClip;
  sceneFrame: number;
}

function isVisibleAt(options: { clip: SceneClip; frame: number }): boolean {
  const { clip, frame } = options;
  return (
    clip.startFrame <= frame && frame < clip.startFrame + clip.durationFrames
  );
}

export function visibleClipsAt(options: {
  sceneTracks: SceneClip[][];
  frame: number;
}): VisibleClip[] {
  const { sceneTracks, frame } = options;
  return [...sceneTracks.entries()].flatMap(([trackIndex, clips]) => {
    const clip = clips.find((candidate) =>
      isVisibleAt({ clip: candidate, frame }),
    );
    if (clip === undefined) {
      return [];
    }
    return [
      {
        trackIndex,
        clip,
        sceneFrame: frame - clip.startFrame + clip.sceneStartFrame,
      },
    ];
  });
}
