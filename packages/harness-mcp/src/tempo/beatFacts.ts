import {
  beatOfFrame,
  framesPerBeatOf,
  tempoGridOf,
  type Project,
} from "@yumekit/project";

export function roundedBeats(beats: number): number {
  return Math.round(beats * 100) / 100;
}

export function tempoFactsOf(project: Project): {
  tempo: number | null;
  frames_per_beat: number | null;
} {
  const grid = tempoGridOf(project);
  return grid === undefined
    ? { tempo: null, frames_per_beat: null }
    : { tempo: grid.tempo, frames_per_beat: framesPerBeatOf(grid) };
}

export function beatOf(options: {
  project: Project;
  frame: number;
}): number | undefined {
  const grid = tempoGridOf(options.project);
  return grid === undefined
    ? undefined
    : roundedBeats(beatOfFrame({ grid, frame: options.frame }));
}

interface TimedClip {
  start_frame: number;
  duration_frames: number;
}

function clipWithBeats<Clip extends TimedClip>(options: {
  clip: Clip;
  project: Project;
}): Clip & { start_beat?: number; duration_beats?: number } {
  const { clip, project } = options;
  const startBeat = beatOf({ project, frame: clip.start_frame });
  const endBeat = beatOf({
    project,
    frame: clip.start_frame + clip.duration_frames,
  });
  return startBeat === undefined || endBeat === undefined
    ? clip
    : {
        ...clip,
        start_beat: startBeat,
        duration_beats: roundedBeats(endBeat - startBeat),
      };
}

export function timelineWithBeats<
  Track extends { clips: TimedClip[] },
  Timeline extends { length_frames: number; tracks: Track[] },
>(options: { timeline: Timeline; project: Project }) {
  const { timeline, project } = options;
  const lengthBeats = beatOf({ project, frame: timeline.length_frames });
  return {
    ...timeline,
    ...(lengthBeats === undefined ? {} : { length_beats: lengthBeats }),
    tracks: timeline.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => clipWithBeats({ clip, project })),
    })),
  };
}
