import type { ProjectState } from "../format/state.js";
import type { Timeline } from "../format/timeline.js";
import { succeed } from "../outcome.js";
import type { EditOfKind } from "./edit.js";
import { problem, type EditResult } from "./editFailure.js";

export function findTimeline(options: {
  state: ProjectState;
  outputId: string;
}): Timeline | undefined {
  return options.state.timelines.find(
    (timeline) => timeline.outputId === options.outputId,
  );
}

export function withTimeline(options: {
  state: ProjectState;
  timeline: Timeline;
}): ProjectState {
  const { state, timeline } = options;
  return {
    ...state,
    timelines: state.timelines.map((existing) =>
      existing.outputId === timeline.outputId ? timeline : existing,
    ),
  };
}

export function timelineNotFound(outputId: string): EditResult {
  return problem({
    kind: "not-found",
    message: `The output "${outputId}" does not exist, so it has no timeline.`,
  });
}

export function setTimeline(options: {
  state: ProjectState;
  edit: EditOfKind<"setTimeline">;
}): EditResult {
  const { state, edit } = options;
  if (findTimeline({ state, outputId: edit.timeline.outputId }) === undefined) {
    return timelineNotFound(edit.timeline.outputId);
  }
  return succeed(withTimeline({ state, timeline: edit.timeline }));
}

export function copyTimeline(options: {
  state: ProjectState;
  edit: EditOfKind<"copyTimeline">;
}): EditResult {
  const { state, edit } = options;
  const source = findTimeline({ state, outputId: edit.fromOutputId });
  if (source === undefined) {
    return timelineNotFound(edit.fromOutputId);
  }
  if (findTimeline({ state, outputId: edit.toOutputId }) === undefined) {
    return timelineNotFound(edit.toOutputId);
  }
  return succeed(
    withTimeline({
      state,
      timeline: {
        outputId: edit.toOutputId,
        tracks: structuredClone(source.tracks),
      },
    }),
  );
}
