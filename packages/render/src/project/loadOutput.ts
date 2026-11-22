import { realpath } from "node:fs/promises";
import {
  openProject,
  type Output,
  type ProjectSnapshot,
  type ProjectStore,
  type Timeline,
} from "@yumekit/project";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";

export interface LoadedOutput {
  folder: string;
  store: ProjectStore;
  snapshot: ProjectSnapshot;
  output: Output;
  timeline: Timeline;
  frameCount: number;
}

function lengthOf(timeline: Timeline): number {
  return Math.max(
    0,
    ...timeline.tracks.flatMap((track) =>
      track.clips.map((clip) => clip.startFrame + clip.durationFrames),
    ),
  );
}

export async function openProjectFolder(
  folder: string,
): Promise<Outcome<ProjectStore, RenderFailure>> {
  const opened = await openProject({ folder });
  return opened.ok
    ? opened
    : fail({
        kind: "project-invalid",
        openFailure: opened.failure,
        message: `The project does not open: ${opened.failure.message}`,
      });
}

export async function loadOutput(options: {
  folder: string;
  outputId: string;
}): Promise<Outcome<LoadedOutput, RenderFailure>> {
  const opened = await openProjectFolder(options.folder);
  if (!opened.ok) {
    return opened;
  }
  const store = opened.value;
  const snapshot = store.read();
  const output = snapshot.project.outputs.find(
    (candidate) => candidate.id === options.outputId,
  );
  if (output === undefined) {
    return fail({
      kind: "output-not-found",
      outputId: options.outputId,
      message: `The project has no output "${options.outputId}". Its outputs are: ${snapshot.project.outputs.map((candidate) => candidate.id).join(", ")}.`,
    });
  }
  const timeline = snapshot.timelines.find(
    (candidate) => candidate.outputId === output.id,
  ) ?? { outputId: output.id, tracks: [] };
  return succeed({
    folder: await realpath(options.folder),
    store,
    snapshot,
    output,
    timeline: {
      ...timeline,
      tracks: timeline.tracks.filter((track) => track.off !== true),
    },
    frameCount: lengthOf(timeline),
  });
}
