import { randomUUID } from "node:crypto";
import { inCatalogOrder, type ProjectSnapshot } from "@yumekit/project";
import type { ExportJob } from "./exportEntry.js";

function lengthFramesOf(options: {
  snapshot: ProjectSnapshot;
  outputId: string;
}): number {
  const timeline = options.snapshot.timelines.find(
    (candidate) => candidate.outputId === options.outputId,
  );
  return Math.max(
    0,
    ...(timeline?.tracks ?? []).flatMap((track) =>
      track.clips.map((clip) => clip.startFrame + clip.durationFrames),
    ),
  );
}

export function filmOutputIdsOf(snapshot: ProjectSnapshot): string[] {
  return snapshot.project.outputs
    .filter((output) => lengthFramesOf({ snapshot, outputId: output.id }) > 0)
    .map((output) => output.id);
}

export function exportJobsOf(options: {
  snapshot: ProjectSnapshot;
  outputIds: readonly string[];
}): ExportJob[] {
  const { snapshot } = options;
  return snapshot.project.outputs
    .filter((output) => options.outputIds.includes(output.id))
    .map((output) => ({
      callId: randomUUID(),
      outputId: output.id,
      platformIds: inCatalogOrder(output.platforms ?? []),
      state: "waiting",
      files: [],
    }));
}
