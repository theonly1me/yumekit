import {
  frameOfBeat,
  tempoGridOf,
  type Project,
  type ProjectSnapshot,
  type Timeline,
} from "@yumekit/project";
import type { SheetFrame } from "@yumekit/render";
import { beatOf } from "../tempo/beatFacts.js";

export type SheetWarningKind =
  "one-color" | "text-outside" | "first-frame-video" | "transition-at-beat-cut";

export interface SheetWarning {
  kind: SheetWarningKind;
  frame: number;
  seconds: number;
  beat?: number;
  message: string;
}

function warningAt(options: {
  project: Project;
  kind: SheetWarningKind;
  frame: number;
  message: string;
}): SheetWarning {
  const { project, frame } = options;
  const beat = beatOf({ project, frame });
  return {
    kind: options.kind,
    frame,
    seconds: Math.round((frame / project.framesPerSecond) * 100) / 100,
    ...(beat === undefined ? {} : { beat }),
    message: options.message,
  };
}

function frameWarnings(options: {
  project: Project;
  frames: SheetFrame[];
}): SheetWarning[] {
  const { project } = options;
  return options.frames.flatMap((frame) => [
    ...(frame.oneColor === undefined
      ? []
      : [
          warningAt({
            project,
            kind: "one-color",
            frame: frame.frame,
            message: `Frame ${String(frame.frame)} is one color (${frame.oneColor}): nothing shows.`,
          }),
        ]),
    ...frame.textOutside.map((text) =>
      warningAt({
        project,
        kind: "text-outside",
        frame: frame.frame,
        message: `The text "${text}" leaves the picture at frame ${String(frame.frame)}.`,
      }),
    ),
  ]);
}

function stuckVideoWarnings(options: {
  project: Project;
  frames: SheetFrame[];
}): SheetWarning[] {
  const { project, frames } = options;
  const warnings: SheetWarning[] = [];
  const firstSeen = new Map<string, number>();
  for (const [index, frame] of frames.entries()) {
    for (const assetId of [...firstSeen.keys()]) {
      if (!frame.firstFrameVideos.includes(assetId)) firstSeen.delete(assetId);
    }
    for (const assetId of frame.firstFrameVideos) {
      const since = firstSeen.get(assetId) ?? frame.frame;
      firstSeen.set(assetId, since);
      const stillAtNext =
        frames[index + 1]?.firstFrameVideos.includes(assetId) === true;
      const held = frame.frame - since >= project.framesPerSecond;
      if (held && !stillAtNext) {
        warnings.push(
          warningAt({
            project,
            kind: "first-frame-video",
            frame: since,
            message: `The video "${assetId}" shows its first frame from frame ${String(since)} to frame ${String(frame.frame)}: it does not play. Check the frame that the scene gives VideoFrame.`,
          }),
        );
      }
    }
  }
  return warnings;
}

function beatCutWarnings(options: {
  project: Project;
  timeline: Timeline;
  beatCuts: number[];
}): SheetWarning[] {
  const { project } = options;
  const grid = tempoGridOf(project);
  if (grid === undefined) return [];
  const clips = options.timeline.tracks.flatMap((track) =>
    track.kind === "scene" ? track.clips : [],
  );
  return options.beatCuts.flatMap((beat) => {
    const cutFrame = frameOfBeat({ grid, beat });
    const blurred = clips.find(
      (clip) =>
        clip.transition !== undefined &&
        cutFrame >= clip.startFrame &&
        cutFrame < clip.startFrame + clip.transition.durationFrames,
    );
    return blurred?.transition === undefined
      ? []
      : [
          warningAt({
            project,
            kind: "transition-at-beat-cut",
            frame: cutFrame,
            message: `Beat ${String(beat)} (frame ${String(cutFrame)}) is in the middle of a ${blurred.transition.kind} of ${String(blurred.transition.durationFrames)} frames into clip "${blurred.id}". So the cut on this beat is soft. For a hard cut, call set_transitions with kind cut and clip_ids ["${blurred.id}"].`,
          }),
        ];
  });
}

export function sheetWarningsOf(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
  frames: SheetFrame[];
  beatCuts: number[];
}): SheetWarning[] {
  const { snapshot } = options;
  const project = snapshot.project;
  return [
    ...frameWarnings({ project, frames: options.frames }),
    ...stuckVideoWarnings({ project, frames: options.frames }),
    ...beatCutWarnings({
      project,
      timeline: options.timeline,
      beatCuts: options.beatCuts,
    }),
  ].toSorted((...[first, second]) => first.frame - second.frame);
}
